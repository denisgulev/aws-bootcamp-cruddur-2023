# Week 5 — DynamoDB and Serverless Caching

## Walkthrough create a DynamoDB instance

1. go into the region you have your application
2. click "Create table"
   1. Table Name -> name of the table
   2. Partition Key -> indicates a part of the primary key
   3. Sort Key -> this is an optional second part of the primary key
   4. Default table setting ->
      1. Read Capacity -> how much we are charged for read operations
      2. Write Capacity -> how much we are charged for write operations
      3. Delete Protection -> turned on for prod env
   5. Tags -> assign tags to resources, in order to facilitate access control and other AWS metrics
3. once the table is created, we can add items to it or use the service's endpoint to interact with it


## Best Practices
DynamoDB is universal for an account, the url is the same across the account.
What differs is the table you are trying to access.

** To access DynamoDB you should make use of **VPC/Gateway Endpoint**,
so that each data access request from an EC2 instance is routed to a VPC endpoint within AWS,
i.e. does not need to go out to the internet and then go back to DynamoDB.

#### Amazon Side
1. Use VPC Endpoint, to communicate with DynamoDB without leaving the safe AWS area
2. Compliance standards
3. DynamoDB should reside in the region we are "legally allowed" to hold user data
4. use Amazon SCPs to help manage DynamoDB operations (delete, create, region lock, etc...)

#### Application Client Side
1. use encryption if we are using DynamoDB to store sensitive information -> IAM Roles / Cognito Identity Pool
2. DO NOT access DynamoDB from the internet, make use of VPC Endpoints

---

We want to use DynamoDB to handle direct messages between users.
In NoSQL we want to structure our data based on the access patterns we need to support. (i.e. how our application will use this data)

We want:
1. a group of "CONVERSATION" objects that represent a set of message between two users; on the UI, each conversation will display "USER_NAME" of the user i am talking to, "LAST_MESSAGE" of the conversation and the "TIME" of the last reply
2. a conversation object will contain a group of "MESSAGE" objects, represented by "DISPLAY_NAME" of the user who sent the message, "CONTENT" of the message and "TIME" of the message

### Access Pattern A
We need to retrieve the messages of a conversation, sorted by "TIME" in descending order.
These table will have a "Partition Key" of "CONVERSATION_ID" and a "Sort Key" of "TIME".

** In general, as Partition Key we should consider what data we do have on hand to go and get the data we need. (We do not have to use UUIDs everytime) **

### Access Pattern B
We want to see a list of all previous conversations. 
They are listed from newest to oldest (DESC). Want to see the other person we are talking to. 
We want to see the last message (from whomever) in summary.

### Pattern C - Create a Message
Whenever we create a new message, this will create in response a new Conversation or update an existing one.

### Installing Dynamodb
1. add "boto3" to dependencies of the server
2. add the following code to docker compose file
```yaml
    dynamodb-local:
    # https://stackoverflow.com/questions/67533058/persist-local-dynamodb-data-in-volumes-lack-permission-unable-to-open-databa
    # We needed to add user:root to get this working.
    user: root
    command: "-jar DynamoDBLocal.jar -sharedDb -dbPath ./data"
    image: "amazon/dynamodb-local:latest"
    container_name: dynamodb-local
    ports:
       - "8000:8000"
    volumes:
       - "./docker/dynamodb:/home/dynamodblocal/data"
    working_dir: /home/dynamodblocal
```
3. create scripts to interact with dynamodb (backend-flask/bin/ddb and backend-flask/bin/ddb/patterns):
   1. **schema-load** -> create a table with the custom specifications, indicating PartitionKey and SortKey
```python
#! /usr/bin/python3

import boto3
import sys

attrs = {
    'endpoint_url': 'http://localhost:8000'
}

if len(sys.argv) > 1:
    if "prod" == sys.argv[1]:
        attrs = {}

ddb = boto3.client('dynamodb', **attrs)

table_name = "cruddur-messages"

response1 = ddb.create_table(
    TableName=table_name,
    AttributeDefinitions=[
        {
            'AttributeName': 'pk',
            'AttributeType': 'S'
        },
        {
            'AttributeName': 'sk',
            'AttributeType': 'S'
        }
    ],
    KeySchema=[
        {
            'AttributeName': 'pk',
            'KeyType': 'HASH'
        },
        {
            'AttributeName': 'sk',
            'KeyType': 'RANGE'
        }
    ],
    BillingMode='PAY_PER_REQUEST',
    TableClass='STANDARD',
    ResourcePolicy='string',
    OnDemandThroughput={
        'MaxReadRequestUnits': 123,
        'MaxWriteRequestUnits': 123
    }
)
print("table created successfully")

print(response1)
```
   2. **drop** -> delete the table
```bash
#! /bin/bash

# ./bin/ddb/drop cruddur-message prod

if [ -z "$1" ]; then
    echo "TableName argument was not provided."
    exit 1
fi

TABLE_NAME=$1

if [ "$2" == "prod" ]; then
    ENDPOINT_URL=""
else
    ENDPOINT_URL="--endpoint-url=http://localhost:8000"
fi

echo "DELETING TABLE: $TABLE_NAME"

aws dynamodb delete-table $ENDPOINT_URL \
--table-name $TABLE_NAME
```
   3. **seed** -> load data into the table
```python
#! /usr/bin/python3

import boto3
import sys
from datetime import datetime, timedelta, timezone
import uuid
import os

# Calculate paths
current_path = os.path.dirname(os.path.abspath(__file__)) if '__file__' in globals() else os.getcwd()
parent_path = os.path.abspath(os.path.join(current_path, '..', '..'))

# Debugging paths
print(f"Current path: {current_path}")
print(f"Parent path: {parent_path}")

# Add the parent path to sys.path and import the module
if parent_path not in sys.path:
    sys.path.append(parent_path)

from lib.db import db

attrs = {
    'endpoint_url': 'http://localhost:8000'
}

if len(sys.argv) > 1:
    if "prod" == sys.argv[1]:
        attrs = {}

ddb = boto3.client('dynamodb', **attrs)

def get_user_uuids():
    sql = """
        SELECT 
          users.uuid,
          users.display_name,
          users.handle
        FROM users
        WHERE
          users.handle IN(
            %(my_handle)s,
            %(other_handle)s
            )
      """

    users = db.query_array(sql,{
        'my_handle': 'denis',
        'other_handle': 'bob'
    })

    my_user    = next((item for item in users if item["handle"] == 'denis'), None)
    other_user = next((item for item in users if item["handle"] == 'bob'), None)
    results = {
        'my_user': my_user,
        'other_user': other_user
    }
    print('get_user_uuids')
    print(results)
    return results

def create_message_group(client,message_group_uuid, my_user_uuid, last_message_at=None, message=None, other_user_uuid=None, other_user_display_name=None, other_user_handle=None):
    table_name = 'cruddur-messages'
    record = {
        'pk':   {'S': f"GRP#{my_user_uuid}"},
        'sk':   {'S': last_message_at},
        'message_group_uuid': {'S': message_group_uuid},
        'message':  {'S': message},
        'user_uuid': {'S': other_user_uuid},
        'user_display_name': {'S': other_user_display_name},
        'user_handle': {'S': other_user_handle}
    }

    response = client.put_item(
        TableName=table_name,
        Item=record
    )
    print(response)

def create_message(client,message_group_uuid, created_at, message, my_user_uuid, my_user_display_name, my_user_handle):
    table_name = 'cruddur-messages'
    record = {
        'pk':   {'S': f"MSG#{message_group_uuid}"},
        'sk':   {'S': created_at },
        'message_uuid': { 'S': str(uuid.uuid4()) },
        'message': {'S': message},
        'user_uuid': {'S': my_user_uuid},
        'user_display_name': {'S': my_user_display_name},
        'user_handle': {'S': my_user_handle}
    }
    # insert the record into the table
    response = client.put_item(
        TableName=table_name,
        Item=record
    )
    # print the response
    print(response)

message_group_uuid = "5ae290ed-55d1-47a0-bc6d-fe2bc2700399"
now = datetime.now(timezone.utc).astimezone()
users = get_user_uuids()

create_message_group(
    client=ddb,
    message_group_uuid=message_group_uuid,
    my_user_uuid=users['my_user']['uuid'],
    other_user_uuid=users['other_user']['uuid'],
    other_user_handle=users['other_user']['handle'],
    other_user_display_name=users['other_user']['display_name'],
    last_message_at=now.isoformat(),
    message="this is a filler message"
)

create_message_group(
    client=ddb,
    message_group_uuid=message_group_uuid,
    my_user_uuid=users['other_user']['uuid'],
    other_user_uuid=users['my_user']['uuid'],
    other_user_handle=users['my_user']['handle'],
    other_user_display_name=users['my_user']['display_name'],
    last_message_at=now.isoformat(),
    message="this is a filler message"
)

conversation = """
Person 1: Have you ever watched Babylon 5? It's one of my favorite TV shows!
Person 2: Yes, I have! I love it too. What's your favorite season?
Person 1: I think my favorite season has to be season 3. So many great episodes, like "Severed Dreams" and "War Without End."
Person 2: Yeah, season 3 was amazing! I also loved season 4, especially with the Shadow War heating up and the introduction of the White Star.
Person 1: Agreed, season 4 was really great as well. I was so glad they got to wrap up the storylines with the Shadows and the Vorlons in that season.
Person 2: Definitely. What about your favorite character? Mine is probably Londo Mollari.
Person 1: Londo is great! My favorite character is probably G'Kar. I loved his character development throughout the series.
Person 2: G'Kar was definitely a standout character. I also really liked Delenn's character arc and how she grew throughout the series.
Person 1: Delenn was amazing too, especially with her role in the Minbari Civil War and her relationship with Sheridan. Speaking of which, what did you think of the Sheridan character?
Person 2: I thought Sheridan was a great protagonist. He was a strong leader and had a lot of integrity. And his relationship with Delenn was so well-done.
Person 1: I totally agree! I also really liked the dynamic between Garibaldi and Bester. Those two had some great scenes together.
Person 2: Yes! Their interactions were always so intense and intriguing. And speaking of intense scenes, what did you think of the episode "Intersections in Real Time"?
Person 1: Oh man, that episode was intense. It was so well-done, but I could barely watch it. It was just too much.
Person 2: Yeah, it was definitely hard to watch. But it was also one of the best episodes of the series in my opinion.
Person 1: Absolutely. Babylon 5 had so many great episodes like that. Do you have a favorite standalone episode?
Person 2: Hmm, that's a tough one. I really loved "The Coming of Shadows" in season 2, but "A Voice in the Wilderness" in season 1 was also great. What about you?
Person 1: I think my favorite standalone episode might be "The Long Twilight Struggle" in season 2. It had some great moments with G'Kar and Londo.
Person 2: Yes, "The Long Twilight Struggle" was definitely a standout episode. Babylon 5 really had so many great episodes and moments throughout its run.
Person 1: Definitely. It's a shame it ended after only five seasons, but I'm glad we got the closure we did with the series finale.
Person 2: Yeah, the series finale was really well-done. It tied up a lot of loose ends and left us with a great sense of closure.
Person 1: It really did. Overall, Babylon 5 is just such a great show with fantastic characters, writing, and world-building.
Person 2: Agreed. It's one of my favorite sci-fi shows of all time and I'm always happy to revisit it.
Person 1: Same here. I think one of the things that makes Babylon 5 so special is its emphasis on politics and diplomacy. It's not just a show about space battles and aliens, but about the complex relationships between different species and their political maneuvering.
Person 2: Yes, that's definitely one of the show's strengths. And it's not just about big-picture politics, but also about personal relationships and the choices characters make.
Person 1: Exactly. I love how Babylon 5 explores themes of redemption, forgiveness, and sacrifice. Characters like G'Kar and Londo have such compelling arcs that are driven by their choices and actions.
Person 2: Yes, the character development in Babylon 5 is really top-notch. Even minor characters like Vir and Franklin get their moments to shine and grow over the course of the series.
Person 1: I couldn't agree more. And the way the show handles its themes is so nuanced and thought-provoking. For example, the idea of "the one" and how it's used by different characters in different ways.
Person 2: Yes, that's a really interesting theme to explore. And it's not just a one-dimensional concept, but something that's explored in different contexts and with different characters.
Person 1: And the show also does a great job of balancing humor and drama. There are so many funny moments in the show, but it never detracts from the serious themes and the high stakes.
Person 2: Absolutely. The humor is always organic and never feels forced. And the show isn't afraid to go dark when it needs to, like in "Intersections in Real Time" or the episode "Sleeping in Light."
Person 1: Yeah, those episodes are definitely tough to watch, but they're also some of the most powerful and memorable episodes of the series. And it's not just the writing that's great, but also the acting and the production values.
Person 2: Yes, the acting is fantastic across the board. From Bruce Boxleitner's performance as Sheridan to Peter Jurasik's portrayal of Londo, every actor brings their A-game. And the production design and special effects are really impressive for a TV show from the 90s.
Person 1: Definitely. Babylon 5 was really ahead of its time in terms of its visuals and special effects. And the fact that it was all done on a TV budget makes it even more impressive.
Person 2: Yeah, it's amazing what they were able to accomplish with the limited resources they had. It just goes to show how talented the people behind the show were.
Person 1: Agreed. It's no wonder that Babylon 5 has such a devoted fanbase, even all these years later. It's just such a well-crafted and timeless show.
Person 2: Absolutely. I'm glad we can still appreciate it and talk about it all these years later. It really is a show that stands the test of time.
Person 1: One thing I really appreciate about Babylon 5 is how it handles diversity and representation. It has a really diverse cast of characters from different species and backgrounds, and it doesn't shy away from exploring issues of prejudice and discrimination.
Person 2: Yes, that's a great point. The show was really ahead of its time in terms of its diverse cast and the way it tackled issues of race, gender, and sexuality. And it did so in a way that felt natural and integrated into the story.
Person 1: Definitely. It's great to see a show that's not afraid to tackle these issues head-on and address them in a thoughtful and nuanced way. And it's not just about representation, but also about exploring different cultures and ways of life.
Person 2: Yes, the show does a great job of world-building and creating distinct cultures for each of the species. And it's not just about their physical appearance, but also about their customs, beliefs, and values.
Person 1: Absolutely. It's one of the things that sets Babylon 5 apart from other sci-fi shows. The attention to detail and the thought that went into creating this universe is really impressive.
Person 2: And it's not just the aliens that are well-developed, but also the human characters. The show explores the different factions and political ideologies within EarthGov, as well as the different cultures and traditions on Earth.
Person 1: Yes, that's another great aspect of the show. It's not just about the conflicts between different species, but also about the internal struggles within humanity. And it's all tied together by the overarching plot of the Shadow War and the fate of the galaxy.
Person 2: Definitely. The show does a great job of balancing the episodic stories with the larger arc, so that every episode feels important and contributes to the overall narrative.
Person 1: And the show is also great at building up tension and suspense. The slow burn of the Shadow War and the mystery of the Vorlons and the Shadows kept me on the edge of my seat throughout the series.
Person 2: Yes, the show is really good at building up anticipation and delivering satisfying payoffs. Whether it's the resolution of a character arc or the climax of a season-long plotline, Babylon 5 always delivers.
Person 1: Agreed. It's just such a well-crafted and satisfying show, with so many memorable moments and characters. I'm really glad we got to talk about it today.
Person 2: Me too. It's always great to geek out about Babylon 5 with someone who appreciates it as much as I do!
Person 1: Yeah, it's always fun to discuss our favorite moments and characters from the show. And there are so many great moments to choose from!
Person 2: Definitely. I think one of the most memorable moments for me was the "goodbye" scene between G'Kar and Londo in the episode "Objects at Rest." It was such a poignant and emotional moment, and it really showed how far their characters had come.
Person 1: Yes, that was a really powerful scene. It was great to see these two former enemies come together and find common ground. And it was a great way to wrap up their character arcs.
Person 2: Another memorable moment for me was the speech that Sheridan gives in "Severed Dreams." It's such an iconic moment in the show, and it really encapsulates the themes of the series.
Person 1: Yes, that speech is definitely one of the highlights of the series. It's so well-written and well-delivered, and it really captures the sense of hope and defiance that the show is all about.
Person 2: And speaking of great speeches, what did you think of the "Ivanova is always right" speech from "Moments of Transition"?
Person 1: Oh man, that speech gives me chills every time I watch it. It's such a powerful moment for Ivanova, and it really shows her strength and determination as a leader.
Person 2: Yes, that speech is definitely a standout moment for Ivanova's character. And it's just one example of the great writing and character development in the show.
Person 1: Absolutely. It's a testament to the talent of the writers and actors that they were able to create such rich and complex characters with so much depth and nuance.
Person 2: And it's not just the main characters that are well-developed, but also the supporting characters like Marcus, Zack, and Lyta. They all have their own stories and struggles, and they all contribute to the larger narrative in meaningful ways.
Person 1: Definitely. Babylon 5 is just such a well-rounded and satisfying show in every way. It's no wonder that it's still beloved by fans all these years later.
Person 2: Agreed. It's a show that has stood the test of time, and it will always hold a special place in my heart as one of my favorite TV shows of all time.
Person 1: One of the most interesting ethical dilemmas presented in Babylon 5 is the treatment of the Narn by the Centauri. What do you think about that storyline?
Person 2: Yeah, it's definitely a difficult issue to grapple with. On the one hand, the Centauri were portrayed as the aggressors, and their treatment of the Narn was brutal and unjust. But on the other hand, the show also presented some nuance to the situation, with characters like Londo and Vir struggling with their own complicity in the conflict.
Person 1: Exactly. I think one of the strengths of the show is its willingness to explore complex ethical issues like this. It's not just about good guys versus bad guys, but about the shades of grey in between.
Person 2: Yeah, and it raises interesting questions about power and oppression. The Centauri had more advanced technology and military might than the Narn, which allowed them to dominate and subjugate the Narn people. But at the same time, there were also political and economic factors at play that contributed to the conflict.
Person 1: And it's not just about the actions of the Centauri government, but also about the actions of individual characters. Londo, for example, was initially portrayed as a somewhat sympathetic character, but as the series progressed, we saw how his choices and actions contributed to the suffering of the Narn people.
Person 2: Yes, and that raises interesting questions about personal responsibility and accountability. Can an individual be held responsible for the actions of their government or their society? And if so, to what extent?
Person 1: That's a really good point. And it's also interesting to consider the role of empathy and compassion in situations like this. Characters like G'Kar and Delenn showed compassion towards the Narn people and fought against their oppression, while others like Londo and Cartagia were more indifferent or even sadistic in their treatment of the Narn.
Person 2: Yeah, and that raises the question of whether empathy and compassion are innate traits, or whether they can be cultivated through education and exposure to different cultures and perspectives.
Person 1: Definitely. And it's also worth considering the role of forgiveness and reconciliation. The Narn and Centauri eventually came to a sort of reconciliation in the aftermath of the Shadow War, but it was a difficult and painful process that required a lot of sacrifice and forgiveness on both sides.
Person 2: Yes, and that raises the question of whether forgiveness is always possible or appropriate in situations of oppression and injustice. Can the victims of such oppression ever truly forgive their oppressors, or is that too much to ask?
Person 1: It's a tough question to answer. I think the show presents a hopeful message in the end, with characters like G'Kar and Londo finding a measure of redemption and reconciliation. But it's also clear that the scars of the conflict run deep and that healing takes time and effort.
Person 2: Yeah, that's a good point. Ultimately, I think the show's treatment of the Narn-Centauri conflict raises more questions than it answers, which is a testament to its complexity and nuance. It's a difficult issue to grapple with, but one that's worth exploring and discussing.
Person 1: Let's switch gears a bit and talk about the character of Natasha Alexander. What did you think about her role in the series?
Person 2: I thought Natasha Alexander was a really interesting character. She was a tough and competent security officer, but she also had a vulnerable side and a complicated past.
Person 1: Yeah, I agree. I think she added a lot of depth to the show and was a great foil to characters like Garibaldi and Zack.
Person 2: And I also appreciated the way the show handled her relationship with Garibaldi. It was clear that they had a history and a lot of unresolved tension, but the show never made it too melodramatic or over-the-top.
Person 1: That's a good point. I think the show did a good job of balancing the personal drama with the larger political and sci-fi elements. And it was refreshing to see a female character who was just as tough and competent as the male characters.
Person 2: Definitely. I think Natasha Alexander was a great example of a well-written and well-rounded female character. She wasn't just there to be eye candy or a love interest, but had her own story and agency.
Person 1: However, I did feel like the show could have done more with her character. She was introduced fairly late in the series, and didn't have as much screen time as some of the other characters.
Person 2: That's true. I think the show had a lot of characters to juggle, and sometimes that meant some characters got sidelined or didn't get as much development as they deserved.
Person 1: And I also thought that her storyline with Garibaldi could have been developed a bit more. They had a lot of history and tension between them, but it felt like it was resolved too quickly and neatly.
Person 2: I can see where you're coming from, but I also appreciated the way the show didn't drag out the drama unnecessarily. It was clear that they both had feelings for each other, but they also had to focus on their jobs and the larger conflicts at play.
Person 1: I can see that perspective as well. Overall, I think Natasha Alexander was a great addition to the show and added a lot of value to the series. It's a shame we didn't get to see more of her.
Person 2: Agreed. But at least the show was able to give her a satisfying arc and resolution in the end. And that's a testament to the show's strength as a whole.
Person 1: One thing that really stands out about Babylon 5 is the quality of the special effects. What did you think about the show's use of CGI and other visual effects?
Person 2: I thought the special effects in Babylon 5 were really impressive, especially for a show that aired in the 90s. The use of CGI to create the spaceships and other sci-fi elements was really innovative for its time.
Person 1: Yes, I was really blown away by the level of detail and realism in the effects. The ships looked so sleek and futuristic, and the space battles were really intense and exciting.
Person 2: And I also appreciated the way the show integrated the visual effects with the live-action footage. It never felt like the effects were taking over or overshadowing the characters or the story.
Person 1: Absolutely. The show had a great balance of practical effects and CGI, which helped to ground the sci-fi elements in a more tangible and realistic world.
Person 2: And it's also worth noting the way the show's use of visual effects evolved over the course of the series. The effects in the first season were a bit rough around the edges, but by the end of the series, they had really refined and perfected the look and feel of the show.
Person 1: Yes, I agree. And it's impressive how they were able to accomplish all of this on a TV budget. The fact that the show was able to create such a rich and immersive sci-fi universe with limited resources is a testament to the talent and creativity of the production team.
Person 2: Definitely. And it's one of the reasons why the show has aged so well. Even today, the visual effects still hold up and look impressive, which is a rarity for a show that's almost 30 years old.
Person 1: Agreed. And it's also worth noting the way the show's use of visual effects influenced other sci-fi shows that came after it. Babylon 5 really set the bar for what was possible in terms of sci-fi visuals on TV.
Person 2: Yes, it definitely had a big impact on the genre as a whole. And it's a great example of how innovative and groundbreaking sci-fi can be when it's done right.
Person 1: Another character I wanted to discuss is Zathras. What did you think of his character?
Person 2: Zathras was a really unique and memorable character. He was quirky and eccentric, but also had a lot of heart and sincerity.
Person 1: Yes, I thought he was a great addition to the show. He added some much-needed comic relief, but also had some important moments of character development.
Person 2: And I appreciated the way the show used him as a sort of plot device, with his knowledge of time and space being instrumental in the resolution of some of the show's major storylines.
Person 1: Definitely. It was a great way to integrate a seemingly minor character into the larger narrative. And it was also interesting to see the different versions of Zathras from different points in time.
Person 2: Yeah, that was a clever storytelling device that really added to the sci-fi elements of the show. And it was also a great showcase for actor Tim Choate, who played the character with so much charm and energy.
Person 1: I also thought that Zathras was a great example of the show's commitment to creating memorable and unique characters. Even characters that only appeared in a few episodes, like Zathras or Bester, were given distinct personalities and backstories.
Person 2: Yes, that's a good point. Babylon 5 was really great at creating a diverse and interesting cast of characters, with each one feeling like a fully-realized and distinct individual.
Person 1: And Zathras was just one example of that. He was a small but important part of the show's legacy, and he's still remembered fondly by fans today.
Person 2: Definitely. I think his character is a great example of the show's ability to balance humor and heart, and to create memorable and beloved characters that fans will cherish for years to come.
"""

lines = conversation.lstrip("\n").rstrip("\n").split("\n")

for i in range(len(lines)):
    if lines[i].startswith('Person 1: '):
        key = 'my_user'
        message = lines[i].replace('Person 1: ', '')
    elif lines[i].startswith('Person 2: '):
        key = 'other_user'
        message = lines[i].replace('Person 2: ', '')
    else:
        raise "invalid line"

    created_at = (now + timedelta(seconds=i)).isoformat()

    create_message(
        client=ddb,
        message_group_uuid=message_group_uuid,
        created_at=created_at,
        message=message,
        my_user_uuid=users[key]['uuid'],
        my_user_display_name=users[key]['display_name'],
        my_user_handle=users[key]['handle'],
    )
```
   4. **list-tables** -> list all tables in the database
```bash
#! /bin/bash

if [ "$1" = 'prod' ]; then
    ENDPOINT_URL=""
else
    ENDPOINT_URL="--endpoint-url http://localhost:8000"
fi

aws dynamodb list-tables $ENDPOINT_URL --query TableNames --output table
```
   5. **list-conversations** -> list all conversations in the database specifying the owner
```python
#! /usr/bin/python3

import boto3
import sys
import json
import os

# Calculate paths
current_path = os.path.dirname(os.path.abspath(__file__)) if '__file__' in globals() else os.getcwd()
parent_path = os.path.abspath(os.path.join(current_path, '..', '..', '..'))

# Debugging paths
print(f"Current path: {current_path}")
print(f"Parent path: {parent_path}")

# Add the parent path to sys.path and import the module
if parent_path not in sys.path:
  sys.path.append(parent_path)

from lib.db import db

attrs = {
  'endpoint_url': 'http://localhost:8000'
}

if len(sys.argv) == 2:
  if "prod" in sys.argv[1]:
    attrs = {}

ddb = boto3.client('dynamodb', **attrs)
table_name = 'cruddur-messages'

def get_my_user_uuid():
  sql = """
        SELECT 
          users.uuid,
          users.handle
        FROM users
        WHERE
          users.handle IN(%(my_handle)s)
      """

  uuid = db.query_value(sql,{
    'my_handle': 'denis'
  })

  return uuid


brown_user_uuid = get_my_user_uuid()

# define the query parameters
query_params = {
  'TableName': table_name,
  'KeyConditionExpression': 'pk = :pkey',
  'ExpressionAttributeValues': {
    ':pkey': {'S': f"GRP#{brown_user_uuid}"}
  },
  'ReturnConsumedCapacity': 'TOTAL'
}

# query the table
response = ddb.query(**query_params)

# print the items returned by the query
print(json.dumps(response, sort_keys=True, indent=2))
```
   6. **get-conversation** -> get a conversation by its id
```python
#! /usr/bin/python3

import boto3
import sys
import json
import datetime

attrs = {
  'endpoint_url': 'http://localhost:8000'
}

if len(sys.argv) == 2:
  if "prod" in sys.argv[1]:
    attrs = {}

ddb = boto3.client('dynamodb', **attrs)
table_name = 'cruddur-messages'

message_group_uuid = "5ae290ed-55d1-47a0-bc6d-fe2bc2700399"

query_params = {
  'TableName': table_name,
  'KeyConditionExpression': 'pk = :pkey AND begins_with(sk, :year)',
  # 'KeyConditionExpression': 'pk = :pkey AND sk BETWEEN :start_date AND :end_date',
  'ScanIndexForward': True,  # sort by descending order
  'Limit': 20,
  'ExpressionAttributeValues': {
    ':year': {'S': '2024'},
    # ':start_date': {'S': '2024-12-01T00:00:00.000000+00:00'},
    # ':end_date': {'S': '2024-12-31T23:59:59.999999+00:00'},
    ':pkey': {'S': f"MSG#{message_group_uuid}"}
  },
  'ReturnConsumedCapacity': 'TOTAL'
}
# define the query parameters

# query the table
response = ddb.query(**query_params)

# print the items returned by the query
print(json.dumps(response, sort_keys=True, indent=2))

# print the consumed capacity
print(json.dumps(response['ConsumedCapacity'], sort_keys=True, indent=2))

items = response['Items']
reversed_items = items[::-1]

for item in reversed_items:
  sender_handle = item['user_handle']['S']
  message       = item['message']['S']
  timestamp     = item['sk']['S']
  dt_object = datetime.datetime.strptime(timestamp, '%Y-%m-%dT%H:%M:%S.%f%z')
  formatted_datetime = dt_object.strftime('%Y-%m-%d %I:%M %p')
  print(f'{sender_handle: <16}{formatted_datetime: <22}{message[:40]}...')
```

### Implementing functionality in code to interact with Dynamodb

1. Create a "ddb.py" file in the "lib" folder
2. Create "list-users" script to retrieve users' ids from Cognito
3. Create "update-cognito-users-ids" to update users' ids in the database. (This is to be run after the "setup" script)
4. When we start docker compose with local PostgreSQL and DynamoDB, we need to seed data in both the databases, 
   ensuring the user_uuid's references in DynamoDB reflect the correct UUIDs from PostgreSQL database.
5. Implemented "messages.py" in order to retrieve message of a specific message_group
6. Inside "create_message.py" we added operations to create a new message inside a message_group and create a new message_group

### DynamoDB Streams - trigger to update message groups

1. execute ./bin/ddb/schema-load prod -> to create the table on DynamoDB online
2. turn on "Streams" with "New image" view type
3. go to VPC aws -> endpoints -> create endpoint -> 
   1. Name -> 
   2. Type -> AWS Services
   3. Services -> choose the service we want to connect to
   4. Network settings -> choose a VPC already existing
   5. Route tables -> check the existing one
   6. Policy -> Full Access
4. create a lambda with the following code:
   ```python
      import json
      import boto3
      from boto3.dynamodb.conditions import Key, Attr
   
      dynamodb = boto3.resource(
      'dynamodb',
      region_name='eu-south-1',
      endpoint_url="http://dynamodb.eu-south-1.amazonaws.com"
      )
      
      def lambda_handler(event, context):
      pk = event['Records'][0]['dynamodb']['Keys']['pk']['S']
      sk = event['Records'][0]['dynamodb']['Keys']['sk']['S']
      if pk.startswith('MSG#'):
      group_uuid = pk.replace("MSG#","")
      message = event['Records'][0]['dynamodb']['NewImage']['message']['S']
      print("GRUP ===>",group_uuid,message)
   
       table_name = 'cruddur-messages'
       index_name = 'message-group-sk-index'
       table = dynamodb.Table(table_name)
       data = table.query(
         IndexName=index_name,
         KeyConditionExpression=Key('message_group_uuid').eq(group_uuid)
       )
       print("RESP ===>",data['Items'])
       
       # recreate the message group rows with new SK value
       for i in data['Items']:
         delete_item = table.delete_item(Key={'pk': i['pk'], 'sk': i['sk']})
         print("DELETE ===>",delete_item)
         
         response = table.put_item(
           Item={
             'pk': i['pk'],
             'sk': sk,
             'message_group_uuid':i['message_group_uuid'],
             'message':message,
             'user_display_name': i['user_display_name'],
             'user_handle': i['user_handle'],
             'user_uuid': i['user_uuid']
           }
         )
         print("CREATE ===>",response)
   ```
   1. add permission "AWSLambdaInvocation-DynamoDB" to the role created with the lambda (under Configuration tab) 
5. Modify 'bin/ddb/schema-load' file by adding information regarding GSI
   ```
   AttributeDefinitions=[
      {
          'AttributeName': 'message_group_uuid',
          'AttributeType': 'S'
      },
   ...
   ...
   ],
   ...
   GlobalSecondaryIndexes=[{
      'IndexName': 'message-group-sk-index',
      'KeySchema': [{
          'AttributeName': 'message_group_uuid',
          'KeyType': 'HASH'
      },{
          'AttributeName': 'sk',
          'KeyType': 'RANGE'
      }],
      'Projection': {
          'ProjectionType': 'ALL',
      },
      'OnDemandThroughput': {
          'MaxReadRequestUnits': 123,
          'MaxWriteRequestUnits': 123
      }
   }]
   ```
6. go on DynamoDB tables page, enter the table just created, enable streams (if not yet enabled) and create a trigger by choosing
   the lambda function we created on point (4)
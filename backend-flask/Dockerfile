FROM 923264624222.dkr.ecr.eu-south-1.amazonaws.com/cruddur-python:3.10-slim

# set the execution starting point in the container
WORKDIR /backend-flask

COPY requirements.txt requirements.txt
# RUN is used to create a layer in the container
RUN pip3 install -r requirements.txt

COPY . .

EXPOSE ${port}
# CMD is the command the container will run when it starts up
CMD ["python3", "-m", "flask", "run", "--host=0.0.0.0", "--port=4567", "--debug"]
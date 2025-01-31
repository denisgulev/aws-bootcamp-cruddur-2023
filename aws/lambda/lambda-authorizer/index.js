"use strict";

const { CognitoJwtVerifier } = require("aws-jwt-verify");

const jwtVerifier = CognitoJwtVerifier.create({
    userPoolId: process.env.USER_POOL_ID,
    tokenUse: "access",
    clientId: process.env.CLIENT_ID
});

exports.handler = async (event) => {
    console.log("request:", JSON.stringify(event, undefined, 2));

    // Extract and validate the Authorization header
    const authHeader = event.headers?.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        console.error("Missing or invalid Authorization header");
        return { isAuthorized: false };
    }

    // Extract the JWT token (remove "Bearer " prefix)
    const jwt = authHeader.split(" ")[1];

    try {
        const payload = await jwtVerifier.verify(jwt);
        console.log("Access allowed. JWT payload:", payload);
    } catch (err) {
        console.error("Access forbidden:", err);
        return {
            isAuthorized: false,
        };
    }
    return {
        isAuthorized: true,
    };
};
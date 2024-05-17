const grpc = require('@grpc/grpc-js');
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const app = express();

const protoLoader = require('@grpc/proto-loader');
const PROTO_PATH = __dirname + '/user.proto';
const packageDefinition = protoLoader.loadSync(PROTO_PATH);
const userService = grpc.loadPackageDefinition(packageDefinition).UserService;

// Définit le client grpc
const client = new userService('localhost:50051', grpc.credentials.createInsecure());

app.get('/api/:id', (req, res) => {
    const id = req.params.user_id; // Corrected parameter name
    client.GetUser({ user_id: id }, (error, response) => { // Pass user_id as the key
        if (error) {
            console.error("Error:", error);
            res.status(500).send(error); // Send error response to the client
        } else {
            console.log("User:", response.user);
            res.json(response.user); // Send user data to the client
        }
    });
});


app.post('/api/post', bodyParser.json(), (req, res) => {
    const { name, email } = req.body;
    client.CreateUser({ name, email }, (err, response) => {
        if (err) {
            res.status(500).send(err);
        } else {
            // res.json({ message: "user created successfully"});
            console.log("user created successfully");
        }
    });
});

// Update User function
app.put('/api/:id', bodyParser.json(), (req, res) => {
    const userId = req.params.user_id; // Correctly extract user ID from route parameters
    const { name, email } = req.body;

    client.UpdateUser({ user_id: userId }, { name: name, email: email }, (error, response) => {
        if (error) {
            console.error("Error updating user:", error);
            res.status(500).send(error);
        } else {
            console.log("User updated successfully");
            res.json({ user_id: response.user_id });
        }
    });
});

// Delete User function
app.delete('/api/:id', (req, res) => {
    const userId = req.params.id; // Extract the user ID from request parameters

    client.DeleteUser({ user_id: userId }, (error, response) => {
        if (error) {
            console.error("Error deleting user:", error);
            res.status(500).send(error);
        } else {
            console.log("User deleted successfully");
            res.json({ message: response.message });
        }
    });
});



// démarre le serveur reverse-proxy
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Reverse proxy server listening on port ${PORT}`);
});
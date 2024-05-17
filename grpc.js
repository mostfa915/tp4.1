const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
require('dotenv').config()
const User = require('./UserModel');

// Charge le service gRPC et le fichier .proto
const PROTO_PATH = __dirname + '/user.proto';
const packageDefinition = protoLoader.loadSync(PROTO_PATH);
const userService = grpc.loadPackageDefinition(packageDefinition).UserService;

//config database
const connectDB = require('./config')
connectDB()

// Define gRPC service implementation functions
function GetUser(call, callback) {
    const id = call.request.user_id;

    User.findOne({ user_id: id }) // Assuming User is a Mongoose model
        .then(user => {
            if (!user) {
                // If no user found, return an error
                const error = new Error(`User with ID ${id} not found`);
                error.code = grpc.status.NOT_FOUND;
                throw error;
            }
            callback(null, { user });
        })
        .catch(err => {
            console.error(err);
            callback({
                code: grpc.status.INTERNAL,
                details: err.message
            }, null);
        });
}


function CreateUser(call, callback) {
    const { name, email } = call.request;
    const newUser = new User({ name, email });

    newUser.save()
        .then(user => {
            callback(null, { id: user._id });
        })
        .catch(err => {
            console.error('Error creating user:', err);
            callback(err, null);
        });
}

function UpdateUser(call, callback) {
    const { name, email } = call.request;
    const id = call.request.user_id;
    User.findByIdAndUpdate(id, { name, email }, { new: true })
        .then(updatedUser => {
            if (!updatedUser) {
                const error = new Error(`User with ID ${id} not found`);
                error.code = grpc.status.NOT_FOUND;
                throw error;
            }
            callback(null, { user_id: updatedUser._id });
        })
        .catch(err => {
            console.error(err);
            callback({
                code: grpc.status.INTERNAL,
                details: err.message
            }, null);
        });
};

function DeleteUser(call, callback) {
    const userId = call.request.user_id; // Extract the user ID

    User.findByIdAndDelete(userId) // Pass the user ID directly
        .then(deletedUser => {
            if (!deletedUser) {
                const error = new Error(`User with ID ${userId} not found`);
                error.code = grpc.status.NOT_FOUND;
                throw error;
            }
            callback(null, { message: `User with ID ${userId} deleted successfully` });
        })
        .catch(err => {
            console.error(err);
            callback({
                code: grpc.status.INTERNAL,
                details: err.message
            }, null);
        });
}


// Démarre le serveur grpc
const server = new grpc.Server();
server.addService(userService.service, { GetUser, CreateUser, UpdateUser, DeleteUser });
server.bindAsync(
    '127.0.0.1:50051',
    grpc.ServerCredentials.createInsecure(),
    () => {
        console.log('listening on port 50051');
        server.start();
    }
);
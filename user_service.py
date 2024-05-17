import grpc
import time
from concurrent import futures
import user_pb2
import user_pb2_grpc
import pymongo

# Initialize MongoDB client
client = pymongo.MongoClient("mongodb+srv://yassinkaabi14:user123@cluster0.ke0uuws.mongodb.net/")
db = client["grpc-communication-python-js"]
collection = db["user_document"]

def add_user_to_database(name, email):
    # Create a new document to insert into the collection
    user_document = {
        "name": name,
        "email": email
    }
    # Insert the document into the collection
    result = collection.insert_one(user_document)
    # Retrieve the inserted user's ID
    user_id = str(result.inserted_id)
    return user_id

def fetch_user_from_database(user_id):
    users_database = [
        {"id": "123", "name": "Alice", "email": "alice@poly.com"},
        {"id": "456", "name": "Bob", "email": "bob@poly.com"}
    ]
    for user in users_database:
        if user["id"] == user_id:
            return user_pb2.User(id=user["id"], name=user["name"], email=user["email"])
    return None

class UserService(user_pb2_grpc.UserServiceServicer):
    def GetUser(self, request, context):
        user_id = request.user_id
        print("Received user ID:", user_id)
        user = fetch_user_from_database(user_id)
        return user_pb2.GetUserResponse(user=user)
    
    def CreateUser(self, request, context):
        name = request.name
        email = request.email
        user_id = add_user_to_database(name, email)
        user = user_pb2.User(id=user_id, name=name, email=email)
        return user_pb2.CreateUserResponse(user=user)

def serve():
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    user_pb2_grpc.add_UserServiceServicer_to_server(UserService(), server)
    server.add_insecure_port('localhost:50051')
    server.start()
    print("Server started, listening on port 50051...")
    try:
        while True:
            time.sleep(86400)
    except KeyboardInterrupt:
        server.stop(0)

if __name__ == '__main__':
    serve()

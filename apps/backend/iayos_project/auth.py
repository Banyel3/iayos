from ninja import NinjaAPI, schema

api = NinjaAPI()

@api.get("/hello")
def hello(request):
    return {"message": "Hello, world!"}
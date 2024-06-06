var mongoClient = null;
var collection, msg;

/* In this collection, the field containing the total number of
   beds in the property is indexed, while the number of bedrooms
   is not.
   
   You can only use an index if the first field in the index is in
   the query */

async function get_IndexDemo(req, res) {

    var rval = msg;

    var query = { beds: 11 };
    result = await collection.find(query).explain('executionStats');
    var indexTime = result.message.executionStats.executionTimeMillis
    indexTime = (indexTime === 0) ? 1 : indexTime
    rval += "Query " + JSON.stringify(query) +  " with index took approx " + 
        indexTime + " ms to find " + result.message.executionStats.nReturned + " records\n";
    

    query = { bedrooms: 8 };
    result = await collection.find(query).explain('executionStats');
    var nonIndexTime = result.message.executionStats.executionTimeMillis
    rval += "Query " + JSON.stringify(query) + " with NO index took approx " + 
        nonIndexTime + " ms to find " + result.message.executionStats.nReturned + " records\n";

    result.ms = indexTime + nonIndexTime //This is the total server time taken by both queries
    result.message = rval //This sets the message to be displayed in the UI.

    res.header("Content-Type", "text/plain");
    res.header("Server-ping-time",mongoClient.getPingTime()+"ms (approx.)");
    res.send({'res': result});
}

async function initWebService() {
    var userName = await system.getenv("MONGO_USERNAME");
    var passWord = await system.getenv("MONGO_PASSWORD", true);

    mongoClient = new MongoClient(
        "mongodb+srv://" + userName + ":" + passWord + "@learn.mongodb.net",
    );
    collection = mongoClient.getDatabase("sample_airbnb")
        .getCollection("largeCollection");
    await mongoClient.ping();
    
    msg = "Check Instructions for more info.\n\n";
}
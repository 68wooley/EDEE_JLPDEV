var mongoClient = null;
var collection;

async function post_Index(req, res) {
    const {name, definition} = JSON.parse(req.body);

    var create = await collection.createIndex(name, definition);
    var list = await collection.listIndexes();

   // var drop = await collection.dropIndex(definition);

   res.send({ create, list });
}

// Test Queries with out indexes

async function get_Index(req,res)
{
    var query = { colour : 'Red', shape: "square" };
    fullExplain = await collection.find(query).limit(0).explain();
    const { nReturned, executionTimeMillis, totalKeysExamined,
      totalDocsExamined, winningPlan } = fullExplain.message.executionStats;
    const importantStats = { nReturned, executionTimeMillis, totalKeysExamined, 
      totalDocsExamined, winningPlan: fullExplain.message.queryPlanner.winningPlan };
    
    res.send({ importantStats, fullExplain });
}

// Create Sample Data
async function post_CreateData(req, res) {
    
    var consolidatedMsg = {ok: true, ms: 0, message: {}};
    
    var dropResult = await collection.drop();
    consolidatedMsg.message.dropResult = {};
    consolidatedMsg.message.dropResult.ok = dropResult.message.ok;
    consolidatedMsg.ms += dropResult.ms;

    const nDocs = 10000;
    var batch = [];

    for (n = 0; n < nDocs; n++) {
       batch.push(createSampleDoc());
       if( batch.length == 1000) {
        await collection.insertMany(batch);
        batch = [];
       }
    }
    
    // Any remaining
    if(batch.length) await collection.insertMany(batch);
    const loaded = await collection.countDocuments({});
    consolidatedMsg.message.loaded = loaded.message;
    consolidatedMsg.ms += loaded.ms;

    consolidatedMsg.message.msg = "Now Change the URL to v1/Index";
    res.send({ res: consolidatedMsg});
}

async function initWebService() {
    var userName = await system.getenv("MONGO_USERNAME");
    var passWord = await system.getenv("MONGO_PASSWORD", true);

    mongoClient = new MongoClient(
        "mongodb+srv://" + userName + ":" + passWord + "@learn.mongodb.net",
    );
    collection = mongoClient.getDatabase("test")
        .getCollection("indexExamples");
}

function createSampleDoc() {
    const doc = {};
    doc.colour = choose(['Red', 'Orange', 'Yellow', 'Green', "Blue"]);
    doc.size = choose(['tiny', 'small', 'medium', 'large', 'huge']);
    doc.shape = choose(['triangle', 'square', 'circle']);
    doc.price = Math.floor(Math.random() * 1000);
    return doc;
}

function choose(choices) {
    var index = Math.floor(Math.random() * choices.length);
    return choices[index];
}
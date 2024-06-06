var mongoClient = null;
var arrayExample;

async function get_Data(req, res) {
  var query = {};

  // WE WANT TO FETCH RECORDS WITH "LARGE CIRCLES"

  // Incorrect as this is matching whole object and none of the array elements
  // eaxctly match this: 
  // query.components = { shape: "circle", size: "large" };

  // Correct - Match is an element matches the sub query
  // query.components  = { $elemMatch: { shape: "circle", size: "small" }} ;

  // Incorrect returns  record if any component is a circle and any is small
  query = { "components.shape": "circle", "components.size": "large" };

  var result = await arrayExample.find(query).toArray();
  res.status(200);
  res.send(result);
}

async function post_Data(req, res) {
  nDocs = await arrayExample.countDocuments();
  if (!nDocs.message) {
    docs = JSON.parse(req.body);
    rval = await arrayExample.insertMany(docs);
    res.status(201);
    res.send(rval);
  } else {
    res.status(200);
    nDocs.message = {msg: "No new data loaded", docs: JSON.stringify(nDocs.message) }
    res.send({res: nDocs});
  }
}

async function initWebService() {
  var userName = await system.getenv("MONGO_USERNAME");
  var passWord = await system.getenv("MONGO_PASSWORD", true);
  mongoClient = new MongoClient(
    "mongodb+srv://" + userName + ":" + passWord + "@learn.mongodb.net"
  );
  arrayExample = mongoClient.getDatabase("examples").getCollection("arrays");
}

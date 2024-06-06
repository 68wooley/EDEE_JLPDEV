var mongoClient = null;
var arrayExample;

async function get_Data(req, res) {
  var query = {};

  // Select document that have small circles
  specification = { shape: "circle", size: "small" };
  query.components = { $elemMatch: specification };

  // $elemMatch doesn't exist as an expression,
  // have to use $filter to make it only return the small circles

  smallCircles = {
    $and: [
      { $eq: ["$$this.shape", "circle"] },
      { $eq: ["$$this.size", "small"] },
    ],
  };
  arrayFilter = { $filter: { input: "$components", cond: smallCircles } };
  projection = { components: arrayFilter };

  var result = await arrayExample.find(query, projection).toArray();
  res.status(200);
  res.send(result);
}

async function post_Data(req, res) {
  nDocs = await arrayExample.countDocuments();
  if (nDocs.message !== 10) {
    docs = JSON.parse(req.body);
    rval = await arrayExample.insertMany(docs);
    res.status(201);
    res.send(rval);
  } else {
    res.status(200);
    nDocs.message = {msg: "No new data loaded" }
    res.send({res: nDocs});
  }
}

async function initWebService() {
  var userName = await system.getenv("MONGO_USERNAME");
  var passWord = await system.getenv("MONGO_PASSWORD", true);
  mongoClient = new MongoClient(
    "mongodb+srv://" + userName + ":" + passWord + "@learn.mongodb.net",
  );
  arrayExample = mongoClient.getDatabase("examples").getCollection("arrays");
}

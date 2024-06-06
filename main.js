let code, response, endpointName, databox, infobox;
let codeChanged;
let _exampleName = []; //Examples used for different orgs
let _saveFileName = null;

//const serviceHostname = "https://68wooley.github.io/EDEE_GCRDEV/";
const serviceHostname = "http://localhost:8080/gcr_edee/";

async function onLoad() {

  // If we supplied an org name in the URL then write that to Localstorage
  const myURL = new URL(window.location);

  if (myURL.searchParams && myURL.searchParams.get("org")) {
    localStorage.setItem("organization", myURL.searchParams.get("org"));
  }
  // If an org name is in LocalStorage then use it to set the examples page
  // This lets us have different examples based on the last link you used with org

  if( localStorage.getItem("organization") &&  document.getElementById("exampleLink")) {
    document.getElementById("exampleLink").href = `examples/${localStorage.getItem("organization")}.html`
  }


  var editor = ace.edit("editor");
  editor.setTheme("ace/theme/pastel_on_dark");
  editor.session.setMode("ace/mode/javascript");
  editor.setOptions({
    fontFamily: "Source Code Pro",
    fontSize: "12pt"
  });
  editor.getSession().on('change', function() {
    codeChangeHandler()
  });

  var outputFormatted = ace.edit("response");
  outputFormatted.setTheme("ace/theme/eclipse");
  outputFormatted.setOption("highlightActiveLine", false)
  outputFormatted.renderer.setShowGutter(false);
  outputFormatted.session.setMode("ace/mode/json");
  outputFormatted.setReadOnly(true);
  outputFormatted.setOptions({
    fontFamily: "Source Code Pro",
    fontSize: "12pt"
  });

  _code = editor; 
  //_output = document.getElementById("response");
  _output = outputFormatted

  _postdata = document.getElementById("postdata");
  endpointName = document.getElementById("endpoint");
  document.getElementById("url").innerText = serviceHostname;
  codeChanged = true;

  // we can feed index.html with a different src file each time
  // we extract the code and put it in the code element

  if (myURL.searchParams && myURL.searchParams.get("src")) {
    await loadTemplateCode(myURL.searchParams.get("src"));
    if (myURL.searchParams.get("title")) {
      document.title = myURL.searchParams.get("title");
    } else {
      document.title = myURL.searchParams.get("src").split("_").join("/");
    }
  }
  setTimeout(codeChangeHandler,0); 
}



function loadLocalCode(filePath) {
  let reader = new FileReader(); // no arguments
  reader.readAsText(filePath);

  //_output.innerText = "";
  _output.setValue("",-1);

  _postdata.innerText = "";

  reader.onload = function () {
    _code.setValue(reader.result, -1);
  };

  reader.onerror = function () {
    alert(reader.error);
  };

}

function insertTextAtCursor(text) {
  let selection = window.getSelection();
  let range = selection.getRangeAt(0);
  range.deleteContents();
  let node = document.createTextNode(text);
  range.insertNode(node);

  selection.collapseToEnd();
}

function messageBox(str) {
  document.getElementById("infobox").innerText = str;
}

async function callService(method) {
  conso1e.contents = "";
  try {
    // loader.style.visibility = "visible";
    _output.setValue("",-1);
    const fullURL = serviceHostname + endpointName.innerText;
    MongoClient._nServerCalls=0; 
    const startTime = Date.now();
    const response = await callVirtualEndpoint(fullURL, method);
    const endTime = Date.now();
    
    if(response._data.res){
      //New code with standardized response object
      let timeToShow = Math.floor(endTime - startTime) //- (MongoClient._serverLatency * MongoClient._nServerCalls));
      if (timeToShow<1) timeToShow=1;
      
      let serverExecTime = response._data.res.ms
      //if (serverExecTime<1) serverExecTime=1;
    
      let renderOut = "";

      if (conso1e.contents) {
        renderOut += "-------------------------- Console --------------------------\n";
        renderOut += conso1e.contents;
        renderOut += "\n-------------------------------------------------------------\n\n";
      }
      renderOut += `\n"ResponseTime": ${timeToShow}ms\n`
      renderOut += `"ServerTime": ${serverExecTime}ms\n`

      renderOut += `"StatusCode": ${response._status}\n`;
      for (const key in response._headers) {
        renderOut += `"${key}": ${response._headers[key]}\n\n`;
      }

      if (
        typeof response._data.res.message === "string" ||
        response._data.res.message instanceof String
      ) {
        renderOut += `${response._data.res.message}`;
      } else {
        renderOut += JSON.stringify(response._data.res.message, null, 2);
      }

      _output.setValue(renderOut,-1);
    }else{
      //Original code - can be removed once all server side code has bee updated
      let timeToShow = Math.floor((endTime - startTime) - (MongoClient._serverLatency * MongoClient._nServerCalls));
      if (timeToShow<1) timeToShow=1;
    
      let renderOut = "";

      if (conso1e.contents) {
        renderOut += "-------------------------- Console --------------------------\n";
        renderOut += conso1e.contents;
        renderOut += "\n-------------------------------------------------------------\n\n";
      }
      renderOut += `\n"ResponseTime": ${timeToShow}ms\n`

      renderOut += `"StatusCode": ${response._status}\n`;
      for (const key in response._headers) {
        renderOut += `"${key}": ${response._headers[key]}\n\n`;
      }

      if (
        typeof response._data === "string" ||
        response._data instanceof String
      ) {
        renderOut += `${response._data}`;
      } else {
        renderOut += JSON.stringify(response._data, null, 2);
      }

      _output.setValue(renderOut,-1);
    }
  } catch (error) {
    console.error(error);
    messageBox(error); // Fatal problem
  } finally {
    // loader.style.visibility = "hidden";
  }
}

//Load a JS file and populate the code side

async function loadTemplateCode(fname) {
  const parts = fname.split("_");
  _exampleName = parts;
  url = "examples/" + parts.join("/") + "/" + parts[parts.length - 1];

  let response = await fetch(`${url}.js`);
  if (response.status == 200) {
    _code.setValue(await response.text(), -1);
  } else {
    //We don't really care if it's missing

    _code.setValue("// EXAMPLE CODE MISSING - Is URL Correct", -1);
  }

  response = await fetch(`${url}.json`);
  if (response.status == 200) {
    _postdata.innerText = await response.text();
  } else {
    _postdata.innerText = "";
  }

  response = await fetch(`${url}.url`);
  if (response.status == 200) {
    endpointName.innerText = await response.text();
  } else {
    endpointName.innerText = "";
  }

  response = await fetch(`${url}.buttons`);
  if (response.status == 200) {
    buttons = await response.text();
    const buttonData = JSON.parse(buttons);
    for( let button in buttonData) {
      container = document.getElementById("buttons");
      newButton = document.createElement("button");
      newButton.innerText=button
      newButton.addEventListener("click", () => { showInfo(buttonData[button])}, false);
      newButton.classList.add("button");

      container.appendChild(newButton);
      //<button class="button" onclick="callService('GET')" id="callServiceGET"> GET </button>
    }
  } 


}

// This can get more fancy over time if needs be
async function showInfo(file)
{
  const url = "examples/" + _exampleName.join("/") + "/";
  const response = await fetch(url + file);
  if (response.status == 200) {
    _output.setValue(r = await response.text(),-1)
  } 
}

function saveToClipboard() {
  navigator.clipboard.writeText(_code.getValue());
}

function saveCode() {
  let data = "";

  data = _code.getValue();

  if (_saveFileName == null) {
    _saveFileName = prompt("Please enter a filename");
  }

  var file = new Blob([data], { type: "application/javascript" });
  var a = document.createElement("a");
  var url = URL.createObjectURL(file);
  a.href = url;
  a.download = _saveFileName;
  document.body.appendChild(a);
  a.click();
  setTimeout(function () {
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, 0);
}

function codeChangeHandler()
{

  data = _code.getValue();
  const getButton = document.getElementById("callServiceGET");
  const postButton = document.getElementById("callServicePOST");
  getButton.hidden = true;
  postButton.hidden = true

  if(data.search("function get_") != -1) {
    getButton.hidden = false;
 
  }
  if(data.search("function post_") != -1) {
    postButton.hidden = false;
  }
}

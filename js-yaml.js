
const jsyaml = require("js-yaml")
const vis = require("vis")

var defaultC4Context = `
context:
  software-system:
    name: Software System
    description: A software system that solves some problem
    relations:
      to:
        user: consumes
    containers:
      web-application:
        name: Web Application
      database:
        name: Database
  user:
    name: User
    caption: Human
    description: 
    relations:
      to:
        software-system: consumes
        admin: is
        supervisor: is
  admin:
    name: Administrator
  supervisor:
    name: Supervisor
  `;

/*
  <component object id>:
    name: <component name>
    description: <conponent description>
    caption: <caption name>
    relations: 
      <to|from>: 
        <related object id>: <relation name>

*/
// Context
// Containers
// Components
// Classes


function createNode(componentId, component, group) {
    return {
        id: componentId,
        name: "name",
        label: component.name == null ? componentId : component.name,
        shape: "box",
        group: group
    }
}

function createConnections(compId, component) {
    var edges = []

    if (!component.hasOwnProperty("relations")) {
        return []
    }

    if (component.relations.hasOwnProperty("to")) {
        for (var to in component.relations.to) {
            edges.push({
                to: to,
                from: compId,
                arrows: "to",
                physics: false
            })
        }
    }

    if (component.relations.hasOwnProperty("from")) {
        for (var from in component.relations.from) {
            edges.push({
                to: compId,
                from: from,
                arrows: "from",
                physics: false
            })
        }
    }

    return edges
}

const levels = ["containers", "components", "classes"]

function unnroll(data, component) {

    //Component level
    //On this level component continas many specific properties
    for (prop in component) {
        var comp = component[prop]

        data.nodes.push(createNode(prop, comp))
        data.edges = data.edges.concat(createConnections(prop, comp))

        for (var levelName of levels) {
            if (comp.hasOwnProperty(levelName)) {
                unnroll(data, comp[levelName]);
            }
        }
    }
}

function loadConfig(yaml_config) {
    var config = jsyaml.load(yaml_config, { condenseFlow: true })

    var data = {
        nodes: [],
        edges: []
    };
    unnroll(data, config["context"])
    return data
}

var options = {

    physics: {
        hierarchicalRepulsion: {
            nodeDistance: 1000
        }
    },
    nodes: {
        size: 40,
        color: {
            background: '#006400'
        },
        font: { color: '#eeeeee', "size": 30 },

    },

};

const monaco = require('@timkendrick/monaco-editor');
const storagePropertyName = "c4-yaml-config";

function createEditor() {
    var editor = monaco.editor.create(document.getElementById('editor'), {
        value: loadC4Context(),
        language: 'yaml',
        minimap: {
            enabled: false
        }
    });
    return editor;
}

function loadC4Context() {
    var c4Context = window.localStorage.getItem(storagePropertyName)
    //load yaml editor context from browser storage, in case storage is empty load default
    if (c4Context == null) {
        console.log("Storage is empty, load default context.")
        c4Context = defaultC4Context;
    }
    return c4Context;
}

function createNetwork() {
    var container = document.getElementById('mynetwork');
    var network = new vis.Network(container, loadConfig(loadC4Context()), options);
    return network;
}

function bindEditorActions(network, editor) {
    //synchronize code editor with network
    editor.onDidChangeModelContent(function (e) {
        var editorContent = editor.getValue();
        var data = loadConfig(editorContent);
        window.localStorage.setItem(storagePropertyName, editorContent);
        console.log("Put editor values into storage.")
        network.setData(data);
        network.redraw();
    });
}


function bindNetworkActions(network, editor) {
    //select code that corespond to the node
    network.on("select", function (event) {
        console.log("node selected" + event)
    })
}

function createLevelsSelector() {
    var navbar = document.getElementById("navbar");
    var selectList = document.createElement("select");
    selectList.id = "mySelect";
    navbar.appendChild(selectList);
    //Create and append the options
    for (var level of levels) {
        var option = document.createElement("option");
        option.value = level;
        option.text = level;
        selectList.appendChild(option);
    }
}

// Called when the Visualization API is loaded.
function draw() {
    const codeEditor = createEditor();
    const network = createNetwork();

    bindEditorActions(network, codeEditor);
    bindNetworkActions(network, codeEditor);
}

module.exports = { draw: draw }
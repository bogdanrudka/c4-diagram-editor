
const jsyaml = require("js-yaml")
const vis = require("vis")

var yaml_config = `
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

(function main() {
    var data = loadConfig()
    console.log(data)
})()


var options = {

    font: {
        size: 100,
    },
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

function createEditor() {
    var editor = monaco.editor.create(document.getElementById('editor'), {
        value: yaml_config,
        language: 'yaml',
        minimap: {
            enabled: false
        }
    });
    editor.onDidChangeModelContent(function (e) {
        var data = loadConfig(editor.getValue());
        network.setData(data);
        network.redraw();
    });
}


// Called when the Visualization API is loaded.
function draw() {
    var container = document.getElementById('mynetwork');

    network = new vis.Network(container, loadConfig(yaml_config), options);

    var navbar = document.getElementById("navbar");
    var selectList = document.createElement("select");
    selectList.id = "mySelect";
    navbar.appendChild(selectList);

    createEditor();

    //Create and append the options
    for (var level of levels) {
        var option = document.createElement("option");
        option.value = level;
        option.text = level;
        selectList.appendChild(option);
    }
}

module.exports = { draw: draw }
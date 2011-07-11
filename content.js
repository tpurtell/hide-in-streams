String.prototype.startsWith = function(prefix){
    return this.lastIndexOf(prefix, 0) === 0;
}

var findFirstLink = function(node) {
    for(var i = 0; i < node.childNodes.length; ++i) {
        var c = node.childNodes[i];
        if(c.nodeType != c.ELEMENT_NODE)
            continue;
        if(c.nodeName.toLowerCase() == "a" && c.getAttribute("href") != null) {
            return c.getAttribute("href");
        }
        var r = findFirstLink(c);
        if(r != null)
            return r;
    }
    return null;
}

var findMenuItems = function(node) {
    var items = [];
    for(var i = 0; i < node.childNodes.length; ++i) {
        var c = node.childNodes[i];
        if(c.nodeType != c.ELEMENT_NODE)
            continue;
        if(c.getAttribute("role") == "menuitem") {
            items.push(c);
        } else {
            items = items.concat(findMenuItems(c));
        }
    }
    return items;    
}

var last_location = undefined;
var updates_checked = {};
var item_added = {};
var checkForClones = function() {
    if(last_location != window.location.toString()) {
        item_added = {};
        updates_checked = {};
        last_location = window.location.toString();
        
        var links = document.documentElement.getElementsByTagName("a");
        for(var i = 0; i < links.length; ++i) {
            if(links[i].textContent.toLowerCase().startsWith("view a")) {
                //we already did it but they flipped the app state without reloading the page
                if(links.length > i + 1 && links[i + 1].textContent.toLowerCase() == "unhide all")
                    break;
                var br = document.createElement("br");
                links[i].parentNode.insertBefore(br, links[i].nextSibling);
                var limited = document.createElement("a");
                limited.textContent = "Unhide all";
                links[i].parentNode.insertBefore(limited, br.nextSibling);
                limited.onclick = function() { 
                    if(!confirm("Are you sure you want to unhide everyone in this stream?"))
                        return;
                    hide = {};
                    window.localStorage.setItem("hidden:" + window.location, JSON.stringify(hide));
                    window.location.reload()
                    return true;
                };
                break;
            }
        }
    }
    var hide = window.localStorage.getItem("hidden:" + window.location);
    if(hide == undefined)
        hide = {};
    else 
        hide = JSON.parse(hide);

    var divs = document.documentElement.getElementsByTagName("div");
    for(var i = 0; i < divs.length; ++i) {
        var div = divs[i];
        var id = div.getAttribute("id");
        if(id === null || !id.startsWith("update-"))
            continue;
        // if(updates_checked[id])
        //     continue;
        updates_checked[id] = true;

        var person = findFirstLink(div);
        if(hide[person]) {
            div.parentNode.removeChild(div);
            --i;
        } else if(!item_added[id]) {
            var items = findMenuItems(div);
            for(var j = 0; j < items.length; ++j) {
                var item = items[j];
                var text = item.textContent.toLowerCase();
                if(text != "block this person") 
                    continue;
                var limited = document.createElement("span");
                limited.setAttribute("style", "padding: 10px 7em 6px 22px;");
                limited.textContent = "Hide in this stream";
                var end = item.childNodes[item.childNodes.length - 1].nextSibling;
                item.parentNode.insertBefore(limited, item.nextSibling);
                var update_data = {
                    menu_node:limited,
                    person_id:person
                };
                limited.addEventListener("click", function() { 
                    if(!confirm("Are you sure you want to hide this poster in this stream?"))
                        return;
                    hide[this.person_id] = true; 
                    //save the hiding
                    window.localStorage.setItem("hidden:" + window.location, JSON.stringify(hide));
                    //need to recheck
                    updates_checked = {};
                    return true;
                }.bind(update_data));
                limited.addEventListener("mouseover", function() { 
                    this.menu_node.setAttribute("style", "padding: 10px 7em 6px 22px; background-color:#a0a0a0");
                }.bind(update_data));
                limited.addEventListener("mouseout", function() { 
                    this.menu_node.setAttribute("style", "padding: 10px 7em 6px 22px;");
                }.bind(update_data));
            } 
            item_added[id] = true;
        }
    }
    
    window.setTimeout(checkForClones, 500);
}

window.setTimeout(checkForClones, 500);

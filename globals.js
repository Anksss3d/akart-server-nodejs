const mysql = require('mysql');
var sqlEscape = require('sqlstring');

function Globals(){
}

Globals.baseUrl = "https://akart-server.herokuapp.com/";


Globals.getConnection = function(){
        return mysql.createConnection({
            host: 'akart.cbdpxm8eyads.us-east-2.rds.amazonaws.com',
            user: 'akart',
            password: 'Ank#1123',
            database: 'akart'
        });
    }

    /* get all category names */
Globals.updateParents = function(req, res, next){
        const connection = getConnection();
        connection.query("select * from categories", (err, rows, fields) => {
            if (err){
                console.log("Error Occured: "+err);
                return;
            }
            rows.forEach(row => {
                let treeObj = JSON.parse(row.category_tree);
                if (treeObj.length > 1){
                    treeObj.pop();
                    console.log("treeobj is: "+JSON.stringify(treeObj));
                    connection.query("select * from categories where category_tree = ?", [JSON.stringify(treeObj)], (err2, rows2) => {
                        if (err2){
                            console.log("Error in finding category id");
                        }else{
                            if(rows2.length > 0){
                                connection.query("update categories set category_parent = ? where category_id = ?", [rows2[0].category_id, row.category_id], (err3, rows3)=>{
                                    if (err3){
                                        console.log("error in updating : "+err3);
                                    }
                                    else{
                                        console.log("Updated parent category successfully");
                                    }
                                });
                            }
                        }
                    });
                }
            });
            res.json(rows);
        });

    }


    /* UPDATE category table new way */
Globals.update_categories = function(req, res, next) {
        const connection = getConnection();
        connection.query("select * from items",(err, rows, fields) => {
            if (err){
                console.log("Error came : "+err);
                return;
            }
            console.log("no of objects: "+rows.length);
            var finalObj = {};
            rows.forEach(row => {
                console.log(row.item_categories);
                var tree = JSON.parse(row.item_categories);
                var parent_tree = [];
                for(var i=0; i<tree.length;i++){
                    parent_tree.push(tree[i]);
                    finalObj[JSON.stringify(parent_tree)] = true;
                }
            });

            for (let [key, value] of Object.entries(finalObj)) {
                connection.query("insert into categories VALUES(category_id, 0, ?, 0)", [key], (err2, rows2) => {
                    if (err2){
                        console.log("couldnt insert as error: "+err2);
                    }
                    else{
                        console.log("inserted category tree: "+key);
                    }
                });
            }
            connection.end();
            res.json(finalObj);
        });
    }


Globals.deleteSingleCategoryItems=function(items, connection){
        var k = 0;
        console.log("item is: ");
        items.forEach(item => {
            const categoryJson = JSON.parse(item.item_categories);
            console.log(categoryJson.length);
            if (categoryJson.length == 1){
                console.log("Deleting Item : "+item.item_categories);
                connection.query("delete from items where item_id = ?", [item.item_id], (err, res) => {
                    if (err){
                        console.log("Error came for deletion: ")
                    }
                    else{
                        console.log("Deleted item ");
                    }
                });
                k += 1;
            }
        });
        console.log("Deleted items : "+k);
    }


Globals.keep3Categories = function(req, res, next){
        const connection = getConnection();
        connection.query("select * from items", (err1, items) => {
            items.forEach(item => {
                var categoryJson = JSON.parse(item.item_categories);
                if (categoryJson.length > 3){
                    var categoryJson2 = categoryJson.splice(0, 3);
                    connection.query("update items set item_categories = ? where item_id=?", [JSON.stringify(categoryJson2), item.item_id], (err, rows) => {
                        if (err){
                            console.log("Error came : "+err);
                        }else{
                            console.log("Category Trimmed");
                        }
                    })
                }
            });
        });
    }

Globals.increementCount = function(connection, id){
        connection.query("update categories set category_count=category_count+1 where category_name=?", [id], (err, rows) =>{
            if (err){
                console.log("Error in increement, err: "+err);
            }
            else{
                console.log("Increemented for id: "+id);
            }
            connection.end();
        });
    }

Globals.addMainCategoryPrefix = function(req, res, next){

    const addPrefix = function(parentId, parentString, connection){
        console.log("Connection obejcts is: "+connection);
        connection.query("select * from categories where category_parent=?",[parentId], (err2, rows2)=>{
            if(err2){
                console.log("error in getting categories using parent id"+err2)
            }else{
                rows2.forEach(row => {
                    treeJson = JSON.parse(row.category_tree);
                    // console.log("datas: "+JSON.stringify(treeJson)+"\tparent: "+parentString);
                    treeJson.splice(0, 0, parentString);
                    // console.log("After it: "+JSON.stringify(treeJson));
                    connection.query("update categories set category_tree = ? where category_id=?", [JSON.stringify(treeJson), row.category_id], (err3, rows3)=>{
                        if(err3){
                            console.log("Error in updating category");
                        }else{
                            console.log("Successfully updated ");
                            addPrefix(row.category_id, parentString, connection);
                        }
                    });
                });
            }
        });
    }

    connection = this.getConnection();

    connection.query("select * from categories where category_parent= 0", (err, rows)=>{
       if (err){
           console.log("error in main category"+err);
       }
       else{
           rows.forEach(row=>{
               addPrefix(row.category_id, (JSON.parse(row.category_tree)[0]), connection);
           });
       }
    });
}

Globals.cleanCategories = function(req, res, next){
    connection = this.getConnection();
    connection.query("select * from categories", (err, rows)=>{
        if (err){
            console.log("error in main category"+err);
        }
        else{
            rows.forEach(row=>{
                treeJSON = JSON.parse(row.category_tree);
                while (treeJSON[0] == treeJSON[1]){
                    treeJSON.splice(0, 1);
                }
                connection.query("update categories set category_tree =? where category_id=?", [JSON.stringify(treeJSON), row.category_id], (err2, rows2)=>{
                    if(err2){
                        console.log("Error came in update : "+err2);
                    }
                    else{
                        console.log("Updated successfully for : "+row.category_id);
                    }
                });
            });
            res.json([]);
        }
    });
}


Globals.addCategoryToItems = function(req, res, next){
    connection = this.getConnection();
    connection.query("select * from items", (err, rows)=>{
        if (err){
            console.log("error in main category"+err);
        }
        else{
            rows.forEach(row=>{
                newCategoryTree = row.item_categories.substr(1);
                queryString = "select * from categories where category_tree LIKE ?";
                // console.log("new String is: "+queryString);
                connection.query(queryString,['%'+newCategoryTree] ,(err2, rows2)=>{
                    if(err2){
                        console.log("Error came in selecting category: "+err2);
                    }
                    else{
                        if (rows2.length==0){
                            console.log("No Row Found, idk how for : "+row.item_categories);
                        }
                        else {
                            if (rows2.length != 1) {
                                console.log("Somethings' wrong for this, lets see rows ");
                            }
                            connection.query("update items set item_categories=? where item_id=?", [rows2[0].category_tree, row.item_id], (err3, rows3)=>{
                                if(err3){
                                    console.log("Error came in udpate : "+err3);
                                }else{
                                    console.log("Updated items category tree for : "+row.item_id);
                                }
                            });
                        }
                    }
                });
            });
            res.json([]);
        }
    });
}




module.exports = Globals;


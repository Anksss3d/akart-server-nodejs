var express = require('express');
var router = express.Router();
const mysql = require('mysql');
const bodyParser = require('body-parser');
const baseUrl = "https://akart-server.herokuapp.com/"

router.use(bodyParser.urlencoded({extended: false}));

function getConnection(){
  return mysql.createConnection({
    host: 'akart.cbdpxm8eyads.us-east-2.rds.amazonaws.com',
    user: 'akart',
    password: 'Ank#1123',
    database: 'akart'
  });
}


function getReturnData(data){
  const dataObj = data.map(row => {
    return {
      item_id: row.item_id,
      item_name: row.item_name,
      item_description: row.item_description,
      item_retail_price: row.item_retail_price,
      item_discounted_price: row.item_discounted_price,
      item_categories: JSON.parse(row.item_categories),
      item_images: JSON.parse(row.item_images),
      item_specifications: JSON.parse(row.item_specifications)
    }
  });
  return dataObj;
}

function getCategoryData(data){
  const dataObj = data.map(row => {
    return {
      category_id: row.category_id,
      category_name: row.category_name,
      category_tree: JSON.parse(row.category_tree),
      category_image: baseUrl + row.category_image
    }
  });
  return dataObj;
}

function increementCount(connection, id){
  connection.query("update categories set category_count=category_count+1 where category_name=?", [id], (err, rows) =>{
    if (err){
      console.log("Error in increement, err: "+err);
    }
    else{
      console.log("Increemented for id: "+id);
    }
  });
}


/* GET products listing. */
router.get('/', function(req, res, next) {
  connection = getConnection();
  connection.query("select * from items", (err, rows, fields) => {
    data = getReturnData(rows);
    res.json(data);
  });
});


/* GET random products listing. */
router.get('/random', function(req, res, next) {
  connection = getConnection();
  connection.query("select * from items ORDER BY rand() LIMIT 10", (err, rows, fields) => {
    data = getReturnData(rows);
    res.json(data);
  });
});


/* get all category names */
router.get('/categories', function(req, res, next){
  var set = new Set();
  connection = getConnection();
  connection.query("select * from categories", (err, rows, fields) => {
    if (err){
      console.log("Error Occured: "+err);
      return;
    }
    res.json(rows);
  });
});

/* GET products listing for given id. */
router.get('/main_categories', function(req, res, next) {
  connection = getConnection();
  connection.query("select * from all_categories where category_parent=0", (err, rows, fields) => {
    if (err){
      console.log("Error Occured : "+err);
      res.json(getErrorJSON(err));
    }
    else{
      rows = getCategoryData(rows);
      res.json(rows);
    }

  });
});


/* get all category names */
router.get('/update_categories', function(req, res, next){
  connection = getConnection();
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
            console.log("Came in here with rows2: "+JSON.stringify(rows2));
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

});


/* UPDATE category table new way */
function update_categories(req, res, next) {
  console.log("Came here ");
  connection = getConnection();
  connection.query("select * from items",(err, rows, fields) => {
    if (err){
      console.log("Error came : "+err);
      return;
    }
    console.log("no of objects: "+rows.length);
    finalObj = {};
    rows.forEach(row => {
      console.log(row.item_categories);
      tree = JSON.parse(row.item_categories);
      parent_tree = [];
      for(i=0; i<tree.length;i++){
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
    res.json(finalObj);
  });
}



/* GET products listing for given id. */
router.get('/:id', function(req, res, next) {
  connection = getConnection();
  connection.query("select * from items where item_id = ?", [req.params.id], (err, rows, fields) => {
    rows = getReturnData(rows);
    if (rows.length == 0){
      res.json(null);
    }
    else {
      res.json(rows[0]);
    }
  });
});





module.exports = router;

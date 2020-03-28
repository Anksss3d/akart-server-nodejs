var express = require('express');
var router = express.Router();
const bodyParser = require('body-parser');
const queryString = require('querystring');
router.use(bodyParser.urlencoded({extended: false}));
var global = require('../globals');



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
      category_image: global.baseUrl + row.category_image
    }
  });
  return dataObj;
}




/* GET products listing. */
router.get('/', function(req, res, next) {
  const connection = global.getConnection();
  var queryString = "select * from items";
  var queryParams = [];
  if (req.query.search){
    queryString = "select * from items where item_name LIKE '%"+req.query.search+"%' or item_categories LIKE '%"+req.query.search+"%'";
    queryParams = [];
  }
  else if (req.query.category){
    queryString = "SELECT i.* FROM items i, (SELECT SUBSTR(category_tree, 1, LENGTH(category_tree)-1) as category_tree from categories where category_id = ?) as c where i.item_categories LIKE CONCAT(c.category_tree, '%')";
    queryParams = [req.query.category];
  }

  connection.query(queryString, queryParams, (err, rows, fields) => {
    if (err){
      console.log("Error Occured"+err);
      return;
    }
    else{
      const data = getReturnData(rows);
      res.json(data);
    }
    connection.end();
  });
});


/* GET random products listing. */
router.get('/random', function(req, res, next) {
  const onnection = global.getConnection();
  connection.query("select * from items ORDER BY rand() LIMIT 10", (err, rows, fields) => {
    const data = getReturnData(rows);
    res.json(data);
    connection.end();
  });
});


/* get all category names */
router.get('/categories', function(req, res, next){
  var set = new Set();
  const connection = global.getConnection();
  connection.query("select * from categories", (err, rows, fields) => {
    if (err){
      console.log("Error Occured: "+err);
      return;
    }
    connection.end();
    res.json(rows);
  });
});

/* GET products listing for given id. */
router.get('/main_categories', function(req, res, next) {
  const connection = global.getConnection();
  connection.query("select * from categories where category_parent=0", (err, rows, fields) => {
    connection.end();
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


router.get('/addCategories', function(req, res, next){
  // global.addCategoryToItems(req, res, next);
});


/* GET products listing for given id. */
router.get('/:id', function(req, res, next) {
  const connection = global.getConnection();
  connection.query("select * from items where item_id = ?", [req.params.id], (err, rows, fields) => {
    connection.end();
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

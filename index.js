const express = require("express");
const app = express();
const cors = require("cors");
const pool = require("./db");
const bcrypt = require("bcrypt");
const parse = require("./parse");
const format = require("pg-format")


// Middleware
app.use(cors());
app.use(express.json());

app.use("/auth", require("./jwtAuth.js"));
// Add all inventory timely
app.post("/add_all_inventory/:date", async (req, res) => {
  try {
    const { date } = req.params;
    const day_of_month = new Date(date).getDate();
    const day_of_week = new Date(date).getDay();
    const sql = `INSERT INTO INVENTORY_MASTER_TIMELY (INVENTORY_ID,CREATED_DATE,LOCATION_,SHOP_NAME,DESCRIPTION,SYSTEM_PAR,PACK,SIZE,
            MEASUREMENT,UOM,CASE_,EA,LB,OZ,BAG,GAL,TRAY,SLEEVES,OPEN_ORDERS,ADJUSTED_PAR,ADJUSTED_ORDER,ORDER_,TOTAL_CASE,
            SHOP_ID,UNLOCK, WEEK_DATE, MONTH_DATE) SELECT INVENTORY_ID,'${date}' AS CREATED_DATE,LOCATION_,SHOP_NAME,DESCRIPTION,
            SYSTEM_PAR,PACK,SIZE, MEASUREMENT,UOM,CASE_,EA,LB,OZ,BAG,GAL,TRAY,SLEEVES,OPEN_ORDERS,ADJUSTED_PAR,ADJUSTED_ORDER,ORDER_,
            TOTAL_CASE, SHOP_ID,UNLOCK, DATE '${date}' - ${day_of_week} + 1,DATE '${date}' - ${day_of_month} + 1
            FROM INVENTORY_MASTER RETURNING 'TRUE' AS IS_SUCCESS;`;
    const run = await pool.query(sql);
    res.json(run.rows[0]);
  } catch (err) {
    console.error(err.message);
  }
});

app.post("/addItem",async (req,res) => {
  try {
    const data = req.body
    const dataToDB = parse(data)
    const selectQuery = getSelectQuery(dataToDB.foodProId)
    const items = await pool.query(selectQuery)
    if(items.rowCount>0) {
      const updateQuery = getUpdateQuery(data.foodProId,data.updatedBy);
      const update = await pool.query(updateQuery)
      if(update.rowCount==0) {
        res.status(500)
        res.json({"err":"Update Failed"})
        res.send()
      }
    }
    const insertQuery = getInsertQuery(dataToDB)
    const insert = await pool.query(insertQuery)
    if(insert.rowCount==0) {
      res.status(500)
      res.json({"err":"Insert Failed"})
      res.send()
    }
    res.status(200)
    res.json({"message":"Insert Success"})
  } catch(err) {
    console.log(err)
  }
})

app.get("/get_distinct_dates", async (req, res) => {
  try {
    //const {date} = res.body;
    const sql = `SELECT DISTINCT TO_CHAR(CREATED_DATE::date, 'MM-DD-YYYY') AS DATE 
                     FROM INVENTORY_MASTER_PRODUCTION;`;
    const run = await pool.query(sql);

    res.json(run.rows);
  } catch (err) {
    console.error(err.message);
  }
});

app.get("/get_year/:date", async (req, res) => {
  try {
    const {date} = req.params;
    const sql = `SELECT DISTINCT DATE_PART('YEAR', CREATED_DATE::date) AS YEAR FROM INVENTORY_MASTER_PRODUCTION WHERE 
    DATE_PART('YEAR', CREATED_DATE::date)=DATE_PART('YEAR', '${date}'::date);`;
    const run = await pool.query(sql);
    res.json(run.rows[0]);
  } catch (err) {
    console.error(err.message);
  }
});

app.post("/importData",async (req,res) => {
  try {
    const data = req.body;
    const dataToDb = data.map((item)=>parse(item));
    const userName = dataToDb[0].updatedBy
    const foodProIDs = data.map((dataToDb)=>dataToDb.foodProId);
    let selectQuery = `SELECT FOODPRO_ID FROM INVENTORY_MASTER_PRODUCTION WHERE ISACTIVE=${true} AND FOODPRO_ID IN (`
    for (let i = 0; i < foodProIDs.length; i++) {
      if(i==foodProIDs.length-1){
        selectQuery+=`'${foodProIDs[i]}')`
      } else{
        selectQuery+=`'${foodProIDs[i]}',`
      }
    }
    const selectResponse = await pool.query(selectQuery);
    if(selectResponse.rowCount>0) {
      const date = new Date().toISOString().slice(0,10)
      let updateQuery = `UPDATE INVENTORY_MASTER_PRODUCTION SET ISACTIVE = '${false}', UPDATED_BY = '${userName}', 
          UPDATED_DATE = '${date}' WHERE FOODPRO_ID IN (`
      const updateIds = selectResponse.rows.map((row)=>row.foodpro_id)
      for(let i=0;i<updateIds.length;i++) {
        if(i==updateIds.length-1) {
          updateQuery+=`'${updateIds[i]}')`
        } else {
          updateQuery+=`'${updateIds[i]}',`
        }
      }
      const updatedRows = await pool.query(updateQuery)
      if(updatedRows.rowCount==0) {
        res.status(500)
        res.json({"err":"Update Failed"})
        res.send()
      }
    }
    dataToDb.forEach( async (ele)=>{
      const insertQuery = getInsertQuery(ele);
      console.log(insertQuery)
      const response = await pool.query(insertQuery)
      if(response.rowCount==0) {
        res.status(500)
        res.json({"message":"Insert Failed"})
        res.send()
      }
    })
  } catch (err) {
    console.log(err)
    res.status(500)
    res.json({"message":"Insert Failed"})
    res.send()
  }
  res.status(200)
  res.json({"message":"Insert Success"})
  res.send()
});

app.get("/get_all_items_description", async (req,res) => {
  try {
    const SQL = `SELECT DISTINCT DESCRIPTION FROM INVENTORY_MASTER_PRODUCTION WHERE ISACTIVE='true'`;
    const run = await pool.query(SQL);
    res.json(run.rows);
  } catch(err) {
    console.log(err.message);
  }
})
app.get("/get_distinct_shops/:date/:shop", async (req, res) => {
  try {
    const { date, shop } = req.params;
    const sql = `SELECT DISTINCT SHOP_ID, SHOP_NAME
                     FROM INVENTORY_MASTER_PRODUCTION where CREATED_DATE = ${date} SHOP_ID = ${shop};`;
    const run = await pool.query(sql);
    res.json(run.rows);
  } catch (err) {
    console.error(err.message);
  }
});

app.get("/get_item/:desc", async (req,res) => {
  try {
    const {desc} = req.params;
    let itemDesc = atob(desc)
    const sql = `SELECT * FROM INVENTORY_MASTER_PRODUCTION where DESCRIPTION = '${itemDesc}' AND ISACTIVE='true' ORDER BY FOODPRO_ID;`;
    const run = await pool.query(sql);
    const returnVal = run.rows;
    res.json(returnVal);
  } catch(err) {
    console.log(err.message)
  }
})

app.get("/get_inventory_data/:date", async (req, res) => {
  try {
    const { date } = req.params;
    const sql = `SELECT * FROM 
                     INVENTORY_MASTER_PRODUCTION WHERE ISACTIVE = 'true' AND CREATED_DATE = '${date}' ORDER BY FOODPRO_ID;`;
    const run = await pool.query(sql);
    const returnVal = run.rows
    res.json(returnVal);
  } catch (err) {
    console.log(err.message);
  }
});

app.get("/get_inventory_data_for_date_range/:startDate/:endDate", async (req, res)=> {
  try {
    const {startDate, endDate} = req.params;
    const sql = `SELECT * FROM 
                      INVENTORY_MASTER_PRODUCTION WHERE ISACTIVE = 'true' AND CREATED_DATE BETWEEN '${startDate}' AND '${endDate}' 
                      ORDER BY FOODPRO_ID;`
    const run = await pool.query(sql);
    const returnVal = run.rows
    res.json(returnVal)
  } catch (err) {
    console.log(err.message)
  }
})

app.get("/get_single_inventory_data/:foodpro_id", async (req, res) => {
  try {
    const { foodProID } = req.params;
    const sql = `SELECT * 
                     FROM INVENTORY_MASTER_PRODUCTION 
                     WHERE FOODPRO_ID = '${foodProID}' and ISACTIVE='true'
                     ORDER BY CREATED_DATE DESC;`;
    const run = await pool.query(sql);
    res.json(run.rows[0]);
  } catch (err) {
    console.log(err.message);
  }
});

app.put(
  "/update_existing_inventory/:foodpro_id",
  async (req, res) => {
    try {
      const {foodpro_id} = req.params;
      const {
        date,
        case_,
        lb,
        bag,
        sleeves,
        tray,
        gal,
        oz,
        adjusted_par,
        ea,
        open_orders,
        order_,
        adjusted_order,
        total_case,
        total_lb,
        total_bags,
        sales,
        yield,
        updatedBy
      } = req.body;
      const sql = `UPDATE INVENTORY_MASTER_PRODUCTION
                        SET openorders = ${open_orders},
                            adjustedpar = ${adjusted_par},
                            order_ = ${order_},
                            adjustedorder = ${adjusted_order},
                            case_=${case_},
                            lb = ${lb},
                            bag = ${bag},
                            sleeves = ${sleeves},
                            tray = ${tray},
                            gal = ${gal},
                            oz = ${oz},
                            ea = ${ea},
                            sales = ${sales},
                            totalcase = ${Number(total_case)},
                            totallb= ${Number(total_lb)},
                            totalbags= ${Number(total_bags)},
                            yeild = ${yield},
                            updated_date = NOW(),
                            updated_by = '${updatedBy}'
                            WHERE FOODPRO_ID = '${foodpro_id}' AND CREATED_DATE = '${date}' AND ISACTIVE='true';
        `;
      const run = await pool.query(sql);
      res.json("Inventory Table was Updated");
    } catch (err) {
      console.log(err.message);
    }
  }
);
app.listen(5000, () => {
  console.log("Server has started at Port 5000");
});

const getInsertQuery = (dataToDB) => {
  const insertQuery = `INSERT INTO INVENTORY_MASTER_PRODUCTION (VENDOR_ID, FOODPRO_ID, CREATED_DATE, LOCATION_, SHOPNAME, 
      DESCRIPTION, SYSTEM_PAR, PACK, SIZE_, MEASUREMENT, UOM, CASE_, EA, LB, OZ, BAG, GAL, TRAY, OPENORDERS, ADJUSTEDPAR, 
      ADJUSTEDORDER, ORDER_, TOTALCASE, UNLOCK, SHOPID, UPDATED_DATE, UPDATED_BY, WEEK_DATE, MONTH_DATE, ISACTIVE, CREATED_BY, SLEEVES,SALES,
      YEILD, ADJUSTED_SALES, TOTALTRAY, TOTALML, TOTALOZ, TOTALLB, TOTALGAL, TOTALGM, TOTALEACH, TOTALLTR, TOTALSLEEVES, 
      OZTOLBS, MLTOOZ, LTRTOOZ, MLTOLTR, TOTALBAGS) VALUES ('${dataToDB.vendorId}', '${dataToDB.foodProId}', '${dataToDB.createdDate}',
      '${dataToDB.location}', '${dataToDB.shopName}','${dataToDB.description}',${dataToDB.systemPar},${dataToDB.pack},${dataToDB.size},
      '${dataToDB.measurement}','${dataToDB.uom}',${dataToDB.case},${dataToDB.ea},${dataToDB.lb},${dataToDB.oz},${dataToDB.bag}
      ,${dataToDB.gal},${dataToDB.tray},${dataToDB.openOrders},${dataToDB.adjustedPar},${dataToDB.adjustedOrder},${dataToDB.order}
      ,${dataToDB.totalCase},'${dataToDB.unlock}','${dataToDB.shopId}','${dataToDB.updatedDate}','${dataToDB.updatedBy}'
      ,'${dataToDB.week_date}','${dataToDB.month_date}',${dataToDB.isActive},'${dataToDB.createdBy}',${dataToDB.sleeves}
      ,${dataToDB.sales},${dataToDB.yield},${dataToDB.adjusted_sales},${dataToDB.totalTray},${dataToDB.totalML}
      ,${dataToDB.totalOZ},${dataToDB.totalLB},${dataToDB.totalGAL},${dataToDB.totalGM},${dataToDB.totalEach},${dataToDB.totalLTR}
      ,${dataToDB.totalSleeves},${dataToDB.ozToLBS},${dataToDB.mlToOZ},${dataToDB.ltrToOZ},${dataToDB.mlToLTR},${dataToDB.totalBags})`
  return insertQuery;
}

const getSelectQuery = (foodProId) => {
  const selectQuery = `SELECT * FROM INVENTORY_MASTER_PRODUCTION WHERE FOODPRO_ID = '${foodProId}'`
  return selectQuery;
}

const getUpdateQuery = (foodProID,userName) => {
  const date = new Date().toISOString().slice(0,10)
  const updateQuery = `UPDATE INVENTORY_MASTER_PRODUCTION SET ISACTIVE = '${false}', UPDATED_BY = '${userName}', 
    UPDATED_DATE = '${date}' WHERE FOODPRO_ID = '${foodProID}'`
  return updateQuery;
}
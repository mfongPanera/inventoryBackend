
module.exports = function (data) {
    const dbData = {
        vendorId: data.vendorId,
        foodProId: data.foodProId,
        isActive: true,
        createdDate: getDate(),
        location: data.location,
        shopName: data.shopName,
        description: data.description,
        systemPar: 0,
        pack: Number(data.packs),
        size: Number(data.size),
        measurement: data.measurement,
        uom: data.uom,
        case: Number(data.case),
        ea: Number(data.ea),
        lb: Number(data.lbs),
        oz: Number(data.oz),
        bag: Number(data.bags),
        gal: Number(data.gal),
        tray: Number(data.trays),
        sleeves: Number(data.sleeves),
        openOrders: 0,
        adjustedPar: 0,
        adjustedOrder: 0,
        order: 0,
        totalCase: 0,
        updatedDate: getDate(),
        shopId: getshopId(data.shopName),
        unlock: data.unlock,
        week_date: getDate(),
        month_date: getDate(),
        sales:0,
        yield:0,
        adjusted_sales:0,
        createdBy: data.userName,
        updatedBy: data.userName,
        totalTray: 0,
        totalML: 0,
        totalOZ: 0,
        totalLB: 0,
        totalGAL: 0,
        totalGM: 0,
        totalEach: 0,
        totalBags:0,
        totalLTR:0,
        totalSleeves:0,
        category: data.category,
        subCategory: data.subCategory,
        grams:Number(data.grams),
        sygmaId: data.sygmaId,
        sygmaStatus: data.sygmaStatus,
        ibohStatus:data.ibohStatus
    }
    calculateOnHandInventory(dbData)
    return dbData
} 

const getConversions = async () => {
    try {
        const uri='http://localhost:5000/getConversions';
        const responses = await fetch(uri);
        const conversions = await responses.json();
        return conversions;
      } catch(err) {
        console.log(err)
      }
}

const calculateOnHandInventory = async (dbData) => {
    let caSe = dbData.case
    let each = dbData.ea  
    let ounce = dbData.oz 
    let pounds = dbData.lb
    let bags = dbData.bag
    let gallons = dbData.gal
    let trays = dbData.tray
    let sleeve = dbData.sleeves
    let gram = dbData.grams
    let pack = dbData.pack 
    let size = dbData.size
    let unitOfMeasurement = dbData.uom
    let unlocks = dbData.unlock.split('-')
    let totalCase=0
    let totalEach=0
    let totalLBS=0
    let totalOZ = 0
    let totalBags=0
    let totalGal=0
    let totalTray=0
    let totalSleeve = 0
    let totalGM =0
    const conversions = await getConversions();
    let oztolbs = parseFloat(conversions.oztolbs);
    let mltoltr = parseFloat(conversions.mltoltr);
    let ltrtooz = parseFloat(conversions.ltrtooz);
    let mltooz = parseFloat(conversions.mltooz);
    let ltrtogal = parseFloat(conversions.ltrtogal);
    let grtooz = parseFloat(conversions.grtooz);
    for(let i=0;i<unlocks.length;i++) {
      if(unlocks[i]==='CASE') {
        totalCase+=caSe
        
      }
      else if(unlocks[i] === 'EA') {
        if(unitOfMeasurement == 'CT') {
          totalCase+=(each/(pack*size))
        } else {
          totalCase+=(each/pack)
        }
      }
      else if(unlocks[i]==='BAGS') {
        totalCase+=(bags/pack)
      }
      
      else if(unlocks[i] === 'LBS') {
        if(unitOfMeasurement==='OZ') {
          totalCase+=(pounds*oztolbs/(pack*size))
        } else {
          totalCase+=(pounds/(pack*size))
        }
      }
      else if(unlocks[i] === 'OZ') {
        if(unitOfMeasurement==='LBS') {
          totalCase+=(ounce/(pack*size*oztolbs))
        } else {
          totalCase+=(ounce/(pack*size))
        }
      }
      else if(unlocks[i] === 'GAL') {
        totalCase+=(gallons/(pack*size))
      }
      else if(unlocks[i]==='TRAY') {
        totalCase+=(trays/4)
      }
      else if(unlocks[i]==='SLEEVE') {
        console.log(sleeve)
        totalCase+=(sleeve/pack)
      }
      else if(unlocks[i]==='GRAM') {
        
      }
    }
    if(unlocks.includes('EA')) {
      if(unitOfMeasurement =='OZ' || unitOfMeasurement=='LBS' || unitOfMeasurement=='GAL' || unitOfMeasurement=='GM' 
      || unitOfMeasurement=='ML') {
        totalEach=totalCase*pack
      } else {
        totalEach=totalCase*pack*size
      }
    }
    if(unlocks.includes('BAGS')) {
      totalBags= totalCase*pack
    }
    if(unlocks.includes('LBS')) {
      totalLBS=totalCase*pack*size
      if(unitOfMeasurement==='OZ'){
        totalLBS=totalLBS/oztolbs
      }
    }
    if(unlocks.includes('OZ')) {
      totalOZ = totalCase*pack*size
      if(unitOfMeasurement==='LBS') {
        totalOZ=totalOZ*oztolbs
      }
    }
    if(unlocks.includes('GAL')) {
      totalGal = totalCase*pack*size
    }
    if(unlocks.includes('TRAY')) {
      totalTray = totalCase*4
    }
    if(unlocks.includes('SLEEVE')) {
      totalSleeve = totalCase*pack;
    }
    dbData.totalBags = totalBags
    dbData.totalCase = totalCase
    dbData.totalTray = totalTray
    dbData.totalOZ = totalOZ
    dbData.totalLB = totalLBS
    dbData.totalGAL = totalGal 
    dbData.totalEach = totalEach 
    dbData.totalSleeves = totalSleeve
}

const getDate = () => {
    var currentDate = new Date();
    return currentDate.toISOString().slice(0,10);
}

const getshopId = (name) => {
    if(name.toLowerCase()==="PANERA BREAD".toLowerCase()) {
        return "Panera"
    } else {
        return ""
    }
}
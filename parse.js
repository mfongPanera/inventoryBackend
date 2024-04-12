
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
        subCategory: data.subCategory
    }
    calculateOnHandInventory(dbData)
    return dbData
} 

const calculateOnHandInventory = (dbData) => {
    let _case_ = dbData.case; 
    let bag_ = dbData.bag;
    let size = dbData.size;
    let pack = dbData.pack;
    let lbs_ = dbData.lb;
    let ozToLbs = dbData.ozToLBS;
    let oz = dbData.oz;
    if(dbData.measurement === "LB") {
        let total_cases_ = _case_ + (bag_*size)/(pack*size)+(lbs_/(pack*size))
        let total_lbs_ = lbs_ + (_case_*(pack*size))+(bag_*size)
        let total_bags_ = bag_ + (_case_*pack)+((lbs_*size)/(pack*size))
        dbData.totalCase = 0;
        dbData.totalLB = 0;
        dbData.totalBags = 0;
    } else if(dbData.measurement === "OZ") {
        let total_cases_ = _case_ + (lbs_/((pack*size)/(ozToLbs)))+((oz/ozToLbs)/((pack*size)/ozToLbs));
        let totalOz = oz + (lbs_*(ozToLbs)) +(_case_ * (pack*size))
        let total_lbs_ = lbs_ + (oz/ozToLbs) + (_case_ * ((pack*size)/ozToLbs))
        dbData.totalCase = 0;
        dbData.totalLB = 0;
        dbData.totalOZ = 0;
    }
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
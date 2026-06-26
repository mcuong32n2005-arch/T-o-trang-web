const { MongoClient } = require("mongodb");

const uri =
    "mongodb+srv://mcuong32n2005_db_user:Cuong123456@cluster0.i5ewbbu.mongodb.net/homestay?retryWrites=true&w=majority&appName=Cluster0";

async function main() {
    try {
        const client = new MongoClient(uri);

        await client.connect();

        console.log("✅ CONNECTED SUCCESS");

        await client.close();
    } catch (err) {
        console.error("❌ ERROR:");
        console.error(err);
    }
}

main();
const fs = require("fs");

const express = require("express");
const router = new express.Router();

const events = JSON.parse(fs.readFileSync("./events.json").toString());

router.get("/", (req,res)=>{
    let cleaned = events.value.map(event=>{
        delete event.institutionId
        delete event.organizationId
        delete event.organizationIds
        delete event.branchId
        delete event.branchIds
        delete event.categoryIds
        delete event.organizationProfilePicture
        delete event.imagePath
        delete event.recScore // seems to always be null
        return event;
    });
    res.render("events", {
        events: cleaned
    })
})

module.exports = router;
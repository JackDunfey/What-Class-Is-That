const fs = require("fs");
const courses = JSON.parse(fs.readFileSync("courses.json").toString());
const withinTimeRange = require("./time.js");

const express = require('express');
const app = express();

app.use(express.urlencoded({extended:true}));
app.use(express.json());

app.use("/static", express.static(`${__dirname}/public`))

app.set('views', '.');
app.set('view engine', 'pug');

app.get("/", (req,res)=>{
    res.sendFile(`${__dirname}/form.html`);
});

app.get("/check", (req,res)=>{
    let {day, room, time} = req.query;
    day = day.toUpperCase();
    room = room.toUpperCase();
    time = time != "" ? time.toUpperCase() : null;
    res.render("results", {
        matches: courses.filter(course=>{
            let isDay = course.Days.includes(day);
            let isRoom = course.Room.includes(room);
            let isTime = time ? (!/[^APM\-0-9:\s]+/g.test(course.Time) ? withinTimeRange(time, course.Time) : false) : true;
            return isDay && isRoom && isTime && course.Type == "LEC";
        })
    });
});

app.listen(80);
Array.prototype.includesObject = function(obj){
    for(let i = 0; i < this.length; i++){
        if(typeof this[i] !== "object")
            continue;
        if(areSame(this[i],obj))
            return true;
    }
    return false;
}

const fs = require("fs");
const courses = JSON.parse(fs.readFileSync("courses.json").toString());
let favorites = fs.readFileSync("favorites.json").toString();
favorites = favorites != "" ? JSON.parse(favorites) : [];
const withinTimeRange = require("./time.js");
const areSame = require("./areSame.js");

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

app.get("/favorites", (req,res)=>{
    res.render("favorites", {favorites});
});

app.put("/add", (req,res)=>{
    let id = req.query.class_id
    let course;
    if(!isNaN(id)){
        course = courses.find(course=>course.Class==id);
    } else {
        course = courses.find(course=>{
            let [a,b] = id.split("||");
            return course.Course == a && course.Section == b;
        });
    }
    if(!course){
        res.status(404).send("Course not found");
    } else if(favorites.includesObject(course)){
        res.status(200).send("Course already included");
    } else {
        // HACK: Probably shouldn't rewrite whole file everytime lol
        course.isFavorite = true;
        favorites.push(course);
        fs.writeFileSync("courses.json", JSON.stringify(courses));
        fs.writeFileSync("favorites.json", JSON.stringify(favorites));
        res.sendStatus(200);
    }
});

app.delete("/remove", (req,res)=>{
    let id = req.query.class_id
    let course;
    if(!isNaN(id)){
        course = courses.find(course=>course.Class==id);
    } else {
        course = courses.find(course=>{
            let [a,b] = id.split("||");
            return course.Course == a && course.Section == b;
        });
    }
    console.log(course)
    if(!favorites.includesObject(course)){
        res.status(404).send("Course not in favorites");
    } else {
        // HACK: Probably shouldn't rewrite whole file everytime lol
        course.isFavorite = false;
        favorites.splice(favorites.indexOf(course), 1);
        fs.writeFileSync("courses.json", JSON.stringify(courses));
        fs.writeFileSync("favorites.json", JSON.stringify(favorites));
        res.sendStatus(200);
    }
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
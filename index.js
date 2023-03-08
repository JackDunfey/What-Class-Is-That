Array.prototype.includesObject = function(obj){
    for(let i = 0; i < this.length; i++){
        if(typeof this[i] !== "object")
            continue;
        if(areSame(this[i],obj))
            return true;
    }
    return false;
}
Array.prototype.indexOfObject = function(obj){
    for(let i = 0; i < this.length; i++)
        if(typeof this[i] === "object" && areSame(this[i], obj))
            return i;
    return -1;
}

const fs = require("fs");
const courses = JSON.parse(fs.readFileSync("courses.json").toString());
let favorites = fs.readFileSync("favorites.json").toString();
favorites = favorites != "" ? JSON.parse(favorites) : [];
const {withinTimeRange, timeToNumber} = require("./time.js");
const areSame = require("./areSame.js");

const express = require('express');
const app = express();

app.use(express.urlencoded({extended:true}));
app.use(express.json());

app.use("/static", express.static(`${__dirname}/public`))

app.use("/events", require("./events.js"));

app.set('views', '.');
app.set('view engine', 'pug');

app.get("/", (req,res)=>{
    res.sendFile(`${__dirname}/form.html`);
});

app.get("/favorites", (req,res)=>{
    res.render("favorites", {favorites});
});

function getCourseFromID(id){
    if(!isNaN(id))
        return courses.find(course=>course.Class==id);
    return courses.find(course=>{
        let [a,b] = id.split("||");
        return course.Course == a && course.Section == b;
    });
}

app.put("/add", (req,res)=>{
    let course = getCourseFromID(req.query.class_id);
    console.log(course);
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
    let course = getCourseFromID(req.query.class_id);
    console.log(course);
    if(!favorites.includesObject(course)){
        res.status(404).send("Course not in favorites");
    } else {
        // HACK: Probably shouldn't rewrite whole file everytime lol
        course.isFavorite = false;
        favorites.splice(favorites.indexOfObject(course), 1);
        fs.writeFileSync("courses.json", JSON.stringify(courses));
        fs.writeFileSync("favorites.json", JSON.stringify(favorites));
        res.sendStatus(200);
    }
});

app.get("/check", (req,res)=>{
    let days = new Array(5).fill(0).map((_,i)=>req.query[`day${i+1}`].toUpperCase()),
        room = req.query.room.toUpperCase(),
        time = req.query.time != "" ? req.query.time.toUpperCase() : null,
        lectures_only = req.query.lectures_only,
        include_clubs = req.query.clubs;
    res.render("results", {
        matches: courses.filter(course=>{
            if(lectures_only && !course.Type.includes("LEC"))
                return false;
            let isDay = days.every(day=>course.Days.includes(day)),
                isRoom = course.Room.includes(room),
                isTime = time ? (!/[^APM\-0-9:\s]+/g.test(course.Time) ? withinTimeRange(time, course.Time) : false) : true;
            return isDay && isRoom && isTime;
        }).sort((a,b)=>!/[^APM\-0-9:\s]+/g.test(a.Time) ? (!/[^APM\-0-9:\s]+/g.test(b.Time) ? (timeToNumber(a.Time.split(" - ")[0]) - timeToNumber(b.Time.split(" - ")[0])) : -1) : !/[^APM\-0-9:\s]+/g.test(b.Time) ? 1 : 0)
    });
});

app.listen(80);
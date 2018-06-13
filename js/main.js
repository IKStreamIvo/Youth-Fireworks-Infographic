//Sound effects
var fireworkLaunch;
var fireworkExplode;

//100% of the graph
const GraphScale = 22000;

//Saving variables
var dataset = {};
var codes = {};
var maleCrimes;
var femaleCrimes;
var combinedData;
var clickedButtons = { "male": false, "female": false};

//Main
$(document).ready(() => {
    //Fade out the graph so the first time it looks like it shoots out of nothing
    $('#graph').fadeOut(0);

    //To fill the empty background with fancy stuff
    placeStars();

    //Setup sounds
    fireworkLaunch = document.createElement('audio');
    fireworkLaunch.setAttribute('src', 'sounds/fireworkLaunch.ogg');
    fireworkExplode = document.createElement('audio');
    fireworkExplode.setAttribute('src', 'sounds/fireworkExplode.ogg');

    //Mouse click particles
    $(document).click(function(e) {
        $("body").explosion({
            origin: {
                x: e.clientX,
                y: e.clientY
            },
            particles: 50,
            particleClass: "particle"
        });
    });

    //Get the dataset
    let datasetCall = getDataset();
    //Wait till we have the dataset
    datasetCall.done(function(){
        //Get a gender filtered lists
        let maleList = filterDataset({"Geslacht":"3000"});
        let femaleList = filterDataset({"Geslacht":"4000"});
        
        //Count crimes per gender, per age
        maleCrimes = {
            "12": 0, "13": 0, "14": 0,
            "15": 0, "16": 0, "17": 0,
        }
        //For each male entry in the dataset count it's crimes..
        // in the correct age group.
        $.each(maleList, function(index, entry){
            //Format age string and make sure we can use it.
            let age = String(entry["Leeftijd"]).trim(); //trim white space off
            if(age === "99" || age === "0") return; //dont want unknown or total
            age = age.slice(1, 3); //age code is 11700, 1-17-00 so slice '17' out.

            //Is there any info at all?
            if(entry["VuurwerkovertredingenHalt_10"] !== null){
                //Add the value of crimes in the age group.
                maleCrimes[age] += entry["VuurwerkovertredingenHalt_10"];
            }
        });

        //Same as above but for females
        femaleCrimes = {
            "12": 0, "13": 0, "14": 0,
            "15": 0, "16": 0, "17": 0,
        }
        $.each(femaleList, function(index, entry){
            let age = String(entry["Leeftijd"]).trim();
            if(age === "99" || age === "0") return;
            age = age.slice(1, 3);
            if(entry["VuurwerkovertredingenHalt_10"] !== null){
                femaleCrimes[age] += entry["VuurwerkovertredingenHalt_10"];
            }
        });

        //Also keep a combined one
        combinedData = {
            "12": 0, "13": 0, "14": 0,
            "15": 0, "16": 0, "17": 0,
        };
        $.each(combinedData, function(key, value){
            combinedData[key] = maleCrimes[key] + femaleCrimes[key];
        });

        //By default we want to show both.
        clickedButtons.male = true;
        clickedButtons.female = true;
        //Function that handles which values to shwo in the graph.
        changeGender();

        //Now everything is ready, add interactivity
        $("#maleConstelation").click(function(){
            if(clickedButtons.male){
                //Disable stars of the constelation
                $(this).find(".constStar").css({
                    'display': 'none'
                });
                clickedButtons.male = false;
            }else{
                //Enable stars of the constelation
                $(this).find(".constStar").css({
                    'display': ''
                });
                clickedButtons.male = true;
            }
            //Update graph
            changeGender();
        });
        $("#femaleConstelation").click(function(){
            if(clickedButtons.female){
                //Disable stars of the constelation
                $(this).find(".constStar").css({
                    'display': 'none'
                });
                clickedButtons.female = false;
            }else{
                //Enable stars of the constelation
                $(this).find(".constStar").css({
                    'display': ''
                });
                clickedButtons.female = true;
            }
            //Update graph
            changeGender();
        });
    });
});


//Get and store the dataset in a public variable for use anywhere.
///Returns the ajax variable so we can do ajax.done(..)
function getDataset(){
    return $.ajax({
        url: "https://opendata.cbs.nl/ODataApi/odata/71930ned/TypedDataSet",
        method: "GET",
        dataType: "json",
        success: function(data){
            dataset = data.value;
        },
        error: function(){
            alert("Failed to get data from https://opendata.cbs.nl/ODataApi/odata/71930ned/TypedDataSet. \nRefresh the page to try again.");
        },
        timeout: 3000,
    });
}

//Apply a filter over the dataset and return the valid entries.
/* Filter parameter format:
{
    "Leeftijd": "11500",
    "Geslacht": "3000"
}
*/
function filterDataset(filter){
    let result = [];
    $.each(dataset, function(key, value){
        //Set this to true for default
        let fitsFilter = true;
        //Go through every filter option,
        // if it's not correct, set fitsFilter to false,
        // and it won't be added to the list.
        $.each(filter, function(filterKey, filterValue){
            if(value[filterKey] !== filterValue){
                fitsFilter = false; //dont add it to the list :(
            }
        });

        //If it's still true, we can keep it :D
        if(fitsFilter){
            result.push(value);
        }
    });
    return result;
}

//Update the graph with data
function applyGraphData(data){
    //Play whoosh sound
    fireworkLaunch.play();
    
    //Foreach age bar change value and width
    $.each(data, function(index, value){
        //First reset it.
        $(`#${index}y #fillme`).css("width", 0);
        $(`#${index}y #amount`).html(0);

        //Fade back in
        $('#graph').fadeIn(500);
            
        //Calculate width
        let width = value/GraphScale * 100;

        //To get the correct bar for the age, 
        // I named the container divs like '12y' and '13y'
        // so #12y #fillme.
        $(`#${index}y #fillme`).animate({
                width:`${width}%`
            }, 
            {
                duration: 500,
                easing: 'linear',
                //We also want to count up the numbers within the time..
                // the width is animating.
                step: function(now) {
                    //now is the 'width' value it is currently at.
                    //Convert back to the number instead of %
                    let progress = now/100 * GraphScale;
                    //Use timeout to time it correctly
                    setTimeout(function(){
                        $(`#${index}y #amount`).html(progress.toFixed()); //toFixed because sometimes it had decimals
                    }, progress/1000);
                },
                done: function(){
                    //Boom sound effect
                    fireworkExplode.currentTime = 0;
                    fireworkExplode.play();
                    //Particles
                    $("body").explosion({
                        origin: {
                            x: $(`#${index}y img`).position().left+25,
                            y: $(`#${index}y img`).position().top+100,
                        },
                        particleClass:"particle"
                    });
                }
            }
        );  
    });
}

function changeGender(){
    //First fade out the graph
    $('#graph').fadeOut(500, function(){
        //Then check which genders are selected and 
        // use the corresponding values.
        if(clickedButtons.male && clickedButtons.female){
            applyGraphData(combinedData);
        }else if(clickedButtons.male){
            applyGraphData(maleCrimes);
        }else if(clickedButtons.female){
            applyGraphData(femaleCrimes);
        }else{
            //Empty graph
            applyGraphData({
                "12": 0, "13": 0, "14": 0,
                "15": 0, "16": 0, "17": 0,
            });
        }
    });    
}

//Scatters some stars across the screen
function placeStars(){
    //Template
    let htmlStar = '<div class="star" style="left: _%; top: __%; opacity: 0;"><svg viewBox="0 0 488.34 488.34"><path class="constStar" d="M496,251.12l-202.8-33.8L259.37,14.51a4.16,4.16,0,0,0-8.2,0l-33.8,202.81-202.8,33.8a4.15,4.15,0,0,0,0,8.19l202.8,33.8,33.8,202.8a4.16,4.16,0,0,0,8.2,0l33.8-202.8L496,259.31A4.15,4.15,0,0,0,496,251.12Z"/></svg></div>';

    //Just scatter some around the screen
    for(let i = 1; i < 100; i += 10){
        //Enter correct coords
        let htmlStuff = htmlStar.replace("__", Math.floor(Math.random() * i)).replace("_", Math.floor(Math.random() * i));
        //Add it to the body
        $(htmlStuff).appendTo('body')
        //Animate a nice fade in effect with random opacity values and delays
        .animate({
            "opacity": Math.random() * (1 - .5 + 1) + .5
        }, Math.floor(Math.random() * (2000 - 250 + 1 ) + 250));
    }
    for(let i = 200; i > 10; i -= 10){
        //Enter correct coords
        let htmlStuff = htmlStar.replace("__", Math.floor(Math.random() * i)).replace("_", Math.floor(Math.random() * i));
        //Add it to the body
        $(htmlStuff).appendTo('body')
        //Animate a nice fade in effect with random opacity values and delays
        .animate({
            "opacity": Math.random() * (1 - .5 + 1) + .5
        }, Math.floor(Math.random() * (2000 - 250 + 1 ) + 250));
    }
}

//Particle explosion
//Source: http://www.emanueleferonato.com/2014/04/30/particle-explosion-using-only-jquery/
///Creates an extention on jquery, so we can do like $("body").explosion.
///I modified some values and made it use star svg with custom colors.
(function($){
    $.fn.explosion = function(options){
        //List of colors to choose from
        var colors = ["red", "green", "yellow", "pink", "purple", "orange", "blue"];
        //Add aditional values that were not given by the user
        var settings = $.extend({
                particleClass: "particle",
                origin: {x: 0,y: 0},
                particles: 25,
                radius: 250,
                complete: function() {}
            }, options);
        
        return this.each(function() {	
            //We defined the number of particles we wanted in the settings var, so so many times we're doing this code
            for(i=0; i < settings.particles; i++){
                var particle = $("<div />").addClass(settings.particleClass);
                //Add star svg
                $(particle).html('<svg viewBox="0 0 488.34 488.34"><path d="M496,251.12l-202.8-33.8L259.37,14.51a4.16,4.16,0,0,0-8.2,0l-33.8,202.81-202.8,33.8a4.15,4.15,0,0,0,0,8.19l202.8,33.8,33.8,202.8a4.16,4.16,0,0,0,8.2,0l33.8-202.8L496,259.31A4.15,4.15,0,0,0,496,251.12Z"/></svg>');
                //chose random color of the star
                $(particle).find("path").css("fill", colors[Math.floor(Math.random() * colors.length)]);
                //absolute pos so we can easily control it without interfering with other stuff
                $(particle).css("position", "absolute");
                //Add the particle to whichever element we called this function on ("body" if we did $("body").explosion(..) or "p" if we did $("p")..)
                $(this).append($(particle));

                $(particle).offset({
                    top: settings.origin.y - $(particle).height() / 2,
                    left: settings.origin.x - $(particle).width() / 2
                });
                //adding random margins to make it move overtime (random so it's different for every particle)
                $(particle).animate(
                    {
                        "margin-top": (Math.floor(Math.random() * settings.radius) - settings.radius / 1.5) + "px",
                        "margin-left": (Math.floor(Math.random() * settings.radius) - settings.radius / 2) + "px",
                        "opacity": 0,
                    },
                    {
                        "duration": Math.floor(Math.random() * 1000) + 500, //a fast poof, also random for every particle
                        "complete": function (){
                            //remove particle after done, so we dont clutter the page
                            $(this).remove(); 
                        }
                    }
                );
            }
        });
    };
}(jQuery));
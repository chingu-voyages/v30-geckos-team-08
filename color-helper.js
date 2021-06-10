

// Pie graph & bar graph colors
const COLORS = [
    'rgb(255, 99, 132)',
    'rgb(255, 159, 64)',
    'rgb(255, 205, 86)',
    'rgb(75, 192, 192)',
    'rgb(54, 162, 235)',
    'rgb(153, 102, 255)',
    'rgb(201, 203, 207)'
];


module.exports = function getColors(startColor, numAnswers) {
    let colors = [];
    for (let i = 0; i < numAnswers; i++){
        colors.push(COLORS[startColor]);
        //console.log(COLORS[startColor]);
        startColor++;
        if (startColor == 7)
            startColor = 0;
    }
    //console.log("colors: " + colors);
    return colors;
}



const TokenType = {
    Squared: "^ 2 ",
    Abs: "abs",
    Exponent: " ^ ",
    Modulus: " % ",
    SquareRoot: "sqrt",
    LeftParenthesis: "(",
    RightParenthesis: ")",
    Factorial: "!",
    Divide: " / ",
    Multiplication: " * ",
    Log: "log",
    Add: " + ",
    Subtract: " - ",
    Ln: "ln",
    Sin: "sin",
    Cos: "cos",
    Tan: "tan",
    Degree: "°",
    Dot: ".",
}

class Equation {
    constructor(){
        this.tokens = [];
    }

    push(token){
        this.tokens.push(token);
    }

    append(index, token){
        let oldToken = this.tokens[index];
        this.tokens[index] = oldToken + token;
    }

    removeLastCharacter(index){
        let oldToken = this.tokens[index];
        this.tokens[index] = oldToken.substring(0, oldToken.length - 1);
    }

    get(index){
        return this.tokens[index];
    }

    remove(index){
        this.tokens.splice(index, 1);
    }

    length(){
        return this.tokens.length;
    }

    clear(){
        this.tokens = [];
    }

    toString(){
        return this.tokens.map(token => token.toString()).join("");
    }

    getTokens(){
        return this.tokens;
    }

    overwrite(tokens){
        this.tokens = tokens;
    }
}

let historicalEquations = [];
let selectedHSIndex = -1;
let equation = new Equation();
//let selectedArrowIndex = -2;

window.onload = function(){
    let currentResult = localStorage.getItem('currentResult');
    if(currentResult){
        document.getElementById('result').innerText = currentResult;
    }

    let historicalEquationsString = localStorage.getItem('historicalEquations');
    if(historicalEquationsString){
        historicalEquations = JSON.parse(historicalEquationsString);
    }

    let equationString = localStorage.getItem('equation');
    if(equationString){
        equation.overwrite(JSON.parse(equationString));
    }

    document.getElementById('history-modal-container').addEventListener('mouseup', function(event){
        event.stopPropagation();
        if(event.target === event.currentTarget){
            document.getElementById('history-modal-container').style.display = 'none';
        }
    });

    window.addEventListener("keydown", function (event) {
        switch (event.key) {
            case "Backspace":
                backspace();
                break;
            case "Enter":
                takeStringAndPerformShuntingYardAlgorithm();
                break;
            case "!":
                appendFactorial();
                break;
            case "1": case "2": case "3": case "4": 
            case "5": case "6": case "7": case "8": 
            case "9": case "0":
                window[`append${event.key}`]();
                break;
            case ".":
                appendDot();
                break;
            case "+":
                appendAdd();
                break;
            case "-":
                appendSubtract();
                break;
            case "*":
                appendMultiply();
                break;
            case "/":
                appendDivide();
                break;
            case "%":
                appendModulus();
                break;
            case "^":
                appendExponent();
                break;
            /*case "ArrowLeft":
                if(selectedArrowIndex === -2){
                    selectedArrowIndex = equation.length() - 1;
                } else if(selectedArrowIndex - 1 >= 0){
                    selectedArrowIndex -= 1;
                } else {
                    break;
                }
                updateUI(null, equation.toString());
                break;
            case "ArrowRight":
                if(selectedArrowIndex === -2){
                    selectedArrowIndex = equation.length() - 1;
                } else if(selectedArrowIndex + 1 < equation.length() - 1){
                    selectedArrowIndex += 1;
                } else{
                    break;
                }
                updateUI(null, equation.toString());
                break;*/
            case "ArrowUp":
                if (selectedHSIndex === -1) {
                    selectedHSIndex = historicalEquations.length - 1;
                } else {
                    selectedHSIndex -= 1;
                }
                if (selectedHSIndex >= 0) {
                    equation.overwrite(historicalEquations[selectedHSIndex]);
                    updateUI(null, equation.toString());
                }
                break;
            case "ArrowDown":
                if (selectedHSIndex === -1) {
                    selectedHSIndex = 0;
                } else {
                    selectedHSIndex += 1;
                }
                if (selectedHSIndex < historicalEquations.length) {
                    equation.overwrite(historicalEquations[selectedHSIndex]);
                    updateUI(null, equation.toString());
                }
                break;
        }
    });
}

function tryToFindAnEqThatIncludes(result){
    for(let i = 0; i < historicalEquations.length; i++){
        let eq = historicalEquations[i];
        if(eq.toString().replace(/,/g, "").includes(result)){
            return eq.toString();
        }
    }
    return null;
}

function updateUI(error, result) {
    if (error) {
        document.getElementById('error').style.visibility = 'visible';
        document.getElementById('error').innerText = error;
    } else {
        if(result.length === 0){
            result = "0";
        }
        document.getElementById('error').style.visibility = 'hidden';
        document.getElementById('error').innerText = "";
        /*if(selectedArrowIndex !== -2){
            let selectedChar = result[selectedArrowIndex];
            let startIndex = selectedArrowIndex - 28;
            if(startIndex >= 0){
                document.getElementById('result').innerHTML = result.substring(startIndex, selectedArrowIndex - 1) 
                + "<span class='highlighted'>" + selectedChar + "</span>";
            } else{
                document.getElementById('result').innerHTML = result.substring(0, selectedArrowIndex - 1) 
                + "<span class='highlighted'>" + selectedChar + "</span>" 
                + result.substring(selectedArrowIndex + 1, selectedArrowIndex + Math.abs(startIndex));
            }
        } else{
        }*/
        document.getElementById('result').innerText = result;
        localStorage.setItem('currentResult', result);
        localStorage.setItem('equation', JSON.stringify(equation.getTokens()));

        let eq = tryToFindAnEqThatIncludes(result);

        if(eq){
            // always get last 28 characters
            document.getElementById('equation-guess').innerText = eq.toString().replace(/,/g, "").substring(eq.length - 28);
        } else{
            document.getElementById('equation-guess').innerText = "0";
        }
    }
}

function isFirstCharacter(){
    if(equation.length() === 0){
        return true;
    }
    return false;
}

function isPreviousLeftBracket(){
    if(equation.length() === 0){
        return false;
    }
    return equation.get(equation.length() - 1).includes(TokenType.LeftParenthesis);
}

function isPreviousRightBracket(){
    if(equation.length() === 0){
        return false;
    }
    return equation.get(equation.length() - 1).includes(TokenType.RightParenthesis);
}

function isNumber(token){
    // regex to check if token is a number from range -inf to +inf including decimal numbers
    const regex = new RegExp("^-?\\d*\\.?\\d+$");
    return regex.test(token);
}

function isNumberBetweenCircleDegrees(token){
    // check if the value is between -360.0.... to 360.0.... including decimal numbers
    if (!/^[-+]?\d+(\.\d+)?$/.test(token)) return false; 
    let num = parseFloat(token);
    return num >= -360 && num <= 360;
}

function isPreviousADot(){
    if(equation.length() === 0){
        return false;
    }
    let data = equation.get(equation.length() - 1);
    return data[data.length - 1] === ".";
}

function isPreviousOperator(){
    if(equation.length() === 0){
        return true;
    }

    let data = equation.get(equation.length() - 1);
    return data.includes(TokenType.Add) || 
            data.includes(TokenType.Subtract) || 
            data.includes(TokenType.Multiplication) || 
            data.includes(TokenType.Divide) || 
            data.includes(TokenType.Modulus) || 
            data.includes(TokenType.Exponent);
}

function appendPie(){
    if(!isPreviousOperator()){
        updateUI("Expected an operator before pie", equation.toString());
        return;
    }
    equation.push(Math.PI.toString());
    updateUI(null, equation.toString());
}

function appendEulersNumber(){
    if(!isPreviousOperator()){
        updateUI("Expected an operator before eulers number", equation.toString());
        return;
    }
    equation.push(Math.E.toString());
    updateUI(null, equation.toString());
}

function clearAll(){
    equation.clear();
    operatorStack = [];
    outputStack = [];
    updateUI(null, "0");
}

function backspace(){
    /*if(selectedArrowIndex !== -2){
        equation.remove(selectedArrowIndex);
        selectedArrowIndex -= 1;
        updateUI(null, equation.toString());
        return;
    }*/
    if(isNumber(equation.get(equation.tokens.length - 1)) || isPreviousADot()){
        equation.removeLastCharacter(equation.tokens.length - 1);
    } else {
        equation.remove(equation.tokens.length - 1);
    }
    updateUI(null, equation.length() === 0 ? "0" : equation.toString());
}

function appendSquared(){
    if(!isNumber(equation.get(equation.tokens.length - 1)) && !isPreviousRightBracket()){
        updateUI("Expected a number before squared", equation.toString());
        return;
    }
    equation.push(TokenType.Squared);
    updateUI(null, equation.toString());
}

function appendAbs(){
    if(!isPreviousOperator()){
        updateUI("Expected an operator before abs", equation.toString());
        return;
    }
    equation.push(TokenType.Abs);
    equation.push(TokenType.LeftParenthesis);
    updateUI(null, equation.toString());
}

function appendExponent(){
    if(!isNumber(equation.get(equation.tokens.length - 1)) && !isPreviousRightBracket()){
        updateUI("Expected a number before exponent", equation.toString());
        return;
    }
    equation.push(TokenType.Exponent);
    updateUI(null, equation.toString());
}

function appendModulus(){
    if(!isNumber(equation.get(equation.tokens.length - 1)) && !isPreviousRightBracket()){
        updateUI("Expected a number before modulus", equation.toString());
        return;
    }
    equation.push(TokenType.Modulus);
    updateUI(null, equation.toString());
}

function appendSquareRoot(){
    if(!isPreviousOperator()){
        updateUI("Expected an operator before square root", equation.toString());
        return;
    }
    equation.push(TokenType.SquareRoot);
    equation.push(TokenType.LeftParenthesis);
    updateUI(null, equation.toString());
}

function appendLeftParenthesis(){
    equation.push(TokenType.LeftParenthesis);
    updateUI(null, equation.toString());
}

function appendRightParenthesis(){
    if(isFirstCharacter() || isPreviousLeftBracket()){
        updateUI("Expected a value before right parenthesis", equation.toString());
        return;
    }
    if(isPreviousOperator()){
        updateUI("Expected a value before right parenthesis", equation.toString());
        return;
    }
    equation.push(TokenType.RightParenthesis);
    updateUI(null, equation.toString());
}

function appendFactorial(){
    if(!isPreviousOperator()){
        updateUI("Expected an operator before log", equation.toString());
        return;
    }
    equation.push(TokenType.Factorial);
    equation.push(TokenType.LeftParenthesis);
    updateUI(null, equation.toString());
}

function appendDivide(){
    if(!isNumber(equation.get(equation.tokens.length - 1)) && !isPreviousRightBracket()){
        updateUI("Expected a number before division", equation.toString());
        return;
    }
    equation.push(TokenType.Divide);
    updateUI(null, equation.toString());
}

function append7(){
    if(isNumber(equation.get(equation.tokens.length - 1)) || isPreviousADot()){
        equation.append(equation.tokens.length - 1, "7");
    } else {
        equation.push("7");
    }
    updateUI(null, equation.toString());
}

function append8(){
    if(isNumber(equation.get(equation.tokens.length - 1)) || isPreviousADot()){
        equation.append(equation.tokens.length - 1, "8");
    } else {
        equation.push("8");
    }
    updateUI(null, equation.toString());
}

function append9(){
    if(isNumber(equation.get(equation.tokens.length - 1)) || isPreviousADot()){
        equation.append(equation.tokens.length - 1, "9");
    } else {
        equation.push("9");
    }
    updateUI(null, equation.toString());
}

function appendMultiply(){
    if(!isNumber(equation.get(equation.tokens.length - 1)) && !isPreviousRightBracket()){
        updateUI("Expected a number before multiplication", equation.toString());
        return;
    }
    equation.push(TokenType.Multiplication);
    updateUI(null, equation.toString());
}

function append4(){
    if (isNumber(equation.get(equation.tokens.length - 1)) || isPreviousADot()) {
        equation.append(equation.tokens.length - 1, "4");
    } else {
        equation.push("4");
    }
    updateUI(null, equation.toString());
}

function append5(){
    if(isNumber(equation.get(equation.tokens.length - 1)) || isPreviousADot()){
        equation.append(equation.tokens.length - 1, "5");
    } else {
        equation.push("5");
    }
    updateUI(null, equation.toString());
}

function append6(){
    if(isNumber(equation.get(equation.tokens.length - 1)) || isPreviousADot()){
        equation.append(equation.tokens.length - 1, "6");
    } else {
        equation.push("6");
    }
    updateUI(null, equation.toString());
}

function appendSubtract(){
    if(isFirstCharacter() || isPreviousLeftBracket()){
        equation.push(TokenType.Subtract);
    } else if(!isNumber(equation.get(equation.tokens.length - 1)) && !isPreviousRightBracket()){
        updateUI("Expected a number before subtraction", equation.toString());
        return;
    } else {
        equation.push(TokenType.Subtract);
    }
    updateUI(null, equation.toString());
}

function appendLog(){
    if(!isPreviousOperator()){
        updateUI("Expected an operator before log", equation.toString());
        return;
    }
    equation.push(TokenType.Log);
    equation.push(TokenType.LeftParenthesis);
    updateUI(null, equation.toString());
}

function append1(){
    if(isNumber(equation.get(equation.tokens.length - 1)) || isPreviousADot()){
        equation.append(equation.tokens.length - 1, "1");
    } else {
        equation.push("1");
    }
    updateUI(null, equation.toString());
}

function append2(){
    if(isNumber(equation.get(equation.tokens.length - 1)) || isPreviousADot()){
        equation.append(equation.tokens.length - 1, "2");
    } else {
        equation.push("2");
    }
    updateUI(null, equation.toString());
}

function append3(){
    if(isNumber(equation.get(equation.tokens.length - 1)) || isPreviousADot()){
        equation.append(equation.tokens.length - 1, "3");
    } else {
        equation.push("3");
    }
    updateUI(null, equation.toString());
}

function appendAdd(){
    if(isFirstCharacter() || isPreviousLeftBracket()){
        equation.push("+");
    } else if(!isNumber(equation.get(equation.tokens.length - 1)) && !isPreviousRightBracket()){
        updateUI("Expected a number before addition", equation.toString());
        return;
    } else {
        equation.push(TokenType.Add);
    }
    updateUI(null, equation.toString());
}

function appendLn(){
    if(!isPreviousOperator()){
        updateUI("Expected an operator before ln", equation.toString());
        return;
    }
    equation.push(TokenType.Ln);
    equation.push(TokenType.LeftParenthesis);
    updateUI(null, equation.toString());
}

function append0(){
    if(isNumber(equation.get(equation.tokens.length - 1)) || isPreviousADot()){
        equation.append(equation.tokens.length - 1, "0");
    } else {
        equation.push("0");
    }
    updateUI(null, equation.toString());
}

function appendDot(){
    if(!isNumber(equation.get(equation.tokens.length - 1)) || isPreviousADot()){
        updateUI("Expected a number or found unexpected dot", equation.toString());
        return;
    }
    equation.append(equation.tokens.length - 1, TokenType.Dot);
    updateUI(null, equation);
}

function appendSin(){
    if(!isPreviousOperator()){
        updateUI("Expected an operator before sin", equation.toString());
        return;
    }
    equation.push(TokenType.Sin);
    equation.push(TokenType.LeftParenthesis);
    updateUI(null, equation.toString());
}

function appendCos(){
    if(!isPreviousOperator()){
        updateUI("Expected an operator before cos", equation.toString());
        return;
    }
    equation.push(TokenType.Cos);
    equation.push(TokenType.LeftParenthesis);
    updateUI(null, equation.toString());
}

function appendTan(){
    if(!isPreviousOperator()){
        updateUI("Expected an operator before tan", equation.toString());
        return;
    }
    equation.push(TokenType.Tan);
    equation.push(TokenType.LeftParenthesis);
    updateUI(null, equation.toString());
}

function appendDegree(){
    if(!isNumberBetweenCircleDegrees(equation.get(equation.tokens.length - 1))){
        updateUI("Expected a number before degree", equation.toString());
        return;
    }
    equation.append(equation.tokens.length - 1, TokenType.Degree);
    updateUI(null, equation.toString());
}

function clearLocalStorage(){
    localStorage.clear();
    historicalEquations = [];
    selectedHSIndex = -1;
    equation.clear();
    updateUI(null, "0");
} 

function showHistory(){
    let historyModal = document.getElementById('history-modal-container');
    let historyList = document.getElementById('history-modal');
    historyList.innerHTML = "";
    if(historicalEquations.length === 0){
        updateUI("No history found, perhaps try entering some equations", equation.toString());
        return;
    }

    historicalEquations.forEach((eq) => {
        let div = document.createElement('div');
        div.className = 'history-object';
        div.innerHTML = "<h3>" + eq.toString().replace(/,/g, "") + "</h3>";
        div.addEventListener('click', function(){
            equation.overwrite(eq);
            updateUI(null, equation.toString());
            historyModal.style.display = 'none';
        });
        historyList.appendChild(div);
    });
    historyModal.style.display = 'flex';
}
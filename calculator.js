function getPrecedence(token) {
    switch (token) {
        case TokenType.Add:
            return 1;
        case TokenType.Subtract:
            return 1;
        case TokenType.Multiplication:
            return 2;
        case TokenType.Divide:
            return 2;
        case TokenType.Modulus:
            return 3;
        case TokenType.Exponent:
            return 4;
        case TokenType.Factorial:
            return 5;
        case TokenType.Squared:
            return 6;
        case TokenType.SquareRoot:
            return 7;
        case TokenType.Abs:
            return 7;
        case TokenType.Log:
            return 7;
        case TokenType.Ln:
            return 7;
        case TokenType.Sin:
            return 7;
        case TokenType.Cos:
            return 7;
        case TokenType.Tan:
            return 7;
        case TokenType.LeftParenthesis:
            return 8;
        case TokenType.RightParenthesis:
            return 8;
        default:
            return 0;
    }
}

function isUnaryOperator(token) {  
    switch (token) {
        case TokenType.Factorial:
        case TokenType.Squared:
        case TokenType.SquareRoot:
        case TokenType.Abs:
        case TokenType.Log:
        case TokenType.Ln:
        case TokenType.Sin:
        case TokenType.Cos:
        case TokenType.Tan:
            return true;
        default:
            return false;
    }
}

function factorial(n) {
    if (n === 0) {
        return 1;
    }

    return n * factorial(n - 1);
}

function degreesToRadians(degrees) {
    return degrees * (Math.PI / 180);
}

function updateUIWithResult(error, result) {
    if (error) {
        document.getElementById('error').style.visibility = 'visible';
        document.getElementById('error').innerText = error;
    } else {
        document.getElementById('error').style.visibility = 'hidden';
        document.getElementById('error').innerText = "";
        document.getElementById('result').innerText = result;
        localStorage.setItem('currentResult', result);
        historicalEquations.push(equation.getTokens());
        localStorage.setItem('historicalEquations', JSON.stringify(historicalEquations));
        equation.clear();
        localStorage.setItem('equation', JSON.stringify(equation.getTokens()));
        //convert result to string and push it to equation
        equation.push(result.toString());
    }
}

function takeStringAndPerformShuntingYardAlgorithm() {
    let operatorStack = [];
    let outputStack = [];

    for (let i = 0; i < equation.length(); i++) {
        let token = equation.get(i);

        const precedence = getPrecedence(token);

        if (precedence === 0) { 
            // If token is a number, push it to the output stack
            outputStack.push(token);
        } else if (token === "(") { 
            // Left parenthesis goes directly onto the operator stack
            operatorStack.push(token);
        } else if (token === ")") {
            // Pop operators until we find a left parenthesis
            while (operatorStack.length > 0 && operatorStack[operatorStack.length - 1] !== "(") {
                outputStack.push(operatorStack.pop());
            }
            operatorStack.pop(); // Remove the left parenthesis
        } else {
            // Pop operators with higher/equal precedence (left-associative)
            while (operatorStack.length > 0 
                && operatorStack[operatorStack.length - 1] !== "("
                && getPrecedence(operatorStack[operatorStack.length - 1]) >= precedence) {
                outputStack.push(operatorStack.pop());
            }
            operatorStack.push(token);
        }
    }

    while (operatorStack.length > 0) {
        outputStack.push(operatorStack.pop());
    }

    try{
        let result = calculateResult(outputStack);
        updateUIWithResult(null, result);
    } catch (e) {
        updateUIWithResult(e, null);
    }
}

function calculateResult(outputStack){
    let resultStack = [];

    for (let i = 0; i < outputStack.length; i++) {
        let token = outputStack[i];

        if (getPrecedence(token) === 0) {
            resultStack.push(token);
        } else if (isUnaryOperator(token) && resultStack.length > 0) {
            // remove degree symbol from token if it exists
            let data = resultStack.pop().replace(/°/g, '');
            let operand = parseFloat(data);

            let result = 0;
            switch (token) {
                case TokenType.Factorial:
                    result = factorial(operand);
                    break;
                case TokenType.Squared:
                    result = Math.pow(operand, 2);
                    break;
                case TokenType.SquareRoot:
                    result = Math.sqrt(operand);
                    break;
                case TokenType.Abs:
                    result = Math.abs(operand);
                    break;
                case TokenType.Log:
                    result = Math.log(operand);
                    break;
                case TokenType.Ln:
                    result = Math.log(operand);
                    break;
                case TokenType.Sin:
                    result = Math.sin(degreesToRadians(operand));
                    break;
                case TokenType.Cos:
                    result = Math.cos(degreesToRadians(operand));
                    break;
                case TokenType.Tan:
                    result = Math.tan(degreesToRadians(operand));
                    break;
            }

            // convert result to string and push it to resultStack
            resultStack.push(result.toString());
        } else if (resultStack.length > 1) {
            let operand2 = parseFloat(resultStack.pop());
            let operand1 = parseFloat(resultStack.pop());

            let result = 0;
            switch (token) {
                case TokenType.Add:
                    result = operand1 + operand2;
                    break;
                case TokenType.Subtract:
                    result = operand1 - operand2;
                    break;
                case TokenType.Multiplication:
                    result = operand1 * operand2;
                    break;
                case TokenType.Divide:
                    result = operand1 / operand2;
                    break;
                case TokenType.Modulus:
                    result = operand1 % operand2;
                    break;
                case TokenType.Exponent:
                    result = Math.pow(operand1, operand2);
                    break;
            }

            // convert result to string and push it to resultStack
            resultStack.push(result.toString());
        } else{
            // must be unary operator either - or +
            if(i + 1 >= outputStack.length){
                if(outputStack.length === 2){
                    if(token === TokenType.Subtract){
                        result = -parseFloat(resultStack.pop());
                    } else{
                        result = parseFloat(resultStack.pop());
                    }
                } else{
                    throw "Invalid expression";
                }
            } else{
                let result = 0;
    
                if (token === TokenType.Add) {
                    result = parseFloat(outputStack[++i]);
                } else {
                    result = -parseFloat(outputStack[++i]);
                }
            }

            // convert result to string and push it to resultStack
            resultStack.push(result.toString());
        }
    }

    return resultStack[0];
}
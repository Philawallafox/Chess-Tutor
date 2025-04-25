/* Basic Reset */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Arial', sans-serif;
    line-height: 1.6;
    color: #333;
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
}

header {
    padding: 20px 0;
    border-bottom: 1px solid #eee;
}

nav ul {
    display: flex;
    list-style: none;
}

nav ul li {
    margin-right: 20px;
}

nav a {
    text-decoration: none;
    color: #333;
    font-weight: bold;
}

main {
    padding: 30px 0;
}

.intro {
    text-align: center;
    margin-bottom: 40px;
}

.intro h2 {
    margin-bottom: 15px;
}

.intro p {
    margin-bottom: 30px;
    max-width: 600px;
    margin-left: auto;
    margin-right: auto;
}

#demo-board {
    margin: 30px auto;
}

.btn {
    display: inline-block;
    background: #4a6ea9;
    color: white;
    padding: 10px 20px;
    text-decoration: none;
    border-radius: 5px;
}

footer {
    text-align: center;
    padding: 20px 0;
    border-top: 1px solid #eee;
    font-size: 0.9em;
}

/* Responsive Design */
@media (max-width: 768px) {
    nav ul {
        flex-direction: column;
    }
    
    nav ul li {
        margin-bottom: 10px;
    }
    
    #demo-board {
        width: 250px !important;
    }
}
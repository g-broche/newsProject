"use strict"

/* ***** GLOBAL OBJECTS AND VARIABLES ***** */

const HeadlineGrid = document.getElementById("headlineGrid"); //main interactive news display
const HeadlineTitle = document.getElementById("headlineTitle");
const ArticleGrid = document.getElementById("articleGrid"); //area dedicated to a specific theme (Ukraine currently)
const articleTitle = document.getElementById("articleGridTitle");

// gets the text of the category selected by the user for display purposes when fetching articles
let currentCategory = "";

//Query object containing the method to construct a request url by concatenating some of the object's properties
const Query = {
    construct() {
        let request = `${this.APIUrl}${this.endpoint}?`;
        let iterable = this.filter;
        let isFirst = true;
        for (const property in iterable) {
            if (iterable[property] != "") {
                (isFirst ? isFirst = false : request += '&')
                request += `${property}=${iterable[property]}`;
            }
        }
        request += `&apikey=${this.keyList[4]}`;
        this.request = request;
    }
}

// QueryHeadline will be the object dedicating to fetch requests using the "top-headline" endpoint
const QueryHeadlines = Object.create(Query);
Object.assign(QueryHeadlines, {
    request: "",
    APIUrl: "https://newsapi.org/v2/",
    endpoint: "top-headlines",
    keyList: ["c80cfc2928404db29d71bf9af9cdc196", "4469c333482345e5922480a57f05d07d", "ae4f0f8e31b3431aa4ba2b3e6021248e", "a0ee06128b16460588edb44cf7b96f3a", "b5e101338ce24b57b559e39f411f02fc"],
    filter: {
        category: "",
        country: "fr",
        language: "",
        sortby: "publishedAt",
        q: ""
    }
});

//this function returns a date object with 7 days substracted from the date use for argument
function getEarlierDate(date, interval = 7) {
    let earlierDate = new Date(date);
    earlierDate.setDate(earlierDate.getDate() - interval);
    return earlierDate;
}

let currentDate = new Date();
let earlierDate = getEarlierDate(currentDate);

// QueryEverything will be the object dedicating to fetch requests using the "everything" endpoint, will look for article from the 7 last days
const QueryEverything = Object.create(Query);
Object.assign(QueryEverything, {
    request: "",
    APIUrl: "https://newsapi.org/v2/",
    endpoint: "everything",
    keyList: ["c80cfc2928404db29d71bf9af9cdc196", "4469c333482345e5922480a57f05d07d", "ae4f0f8e31b3431aa4ba2b3e6021248e", "a0ee06128b16460588edb44cf7b96f3a", "b5e101338ce24b57b559e39f411f02fc"],
    filter: {
        language: "fr",
        sortby: "publishedAt",
        q: "Ukraine",
        from: extractDate(earlierDate, true),
        to: extractDate(currentDate, true),
        pageSize: 10
    }
});

/* ***** INPUTS AND EVENTS ***** */

// select element used by the user to specify which of the available countries' medias the user wants to check, will override search by language
const countrySelector = document.getElementById("country");

countrySelector.addEventListener("change", () => {
    QueryHeadlines.filter.country = countrySelector.value;
    QueryHeadlines.filter.language = "";
    updateHeadlines()
});

// select element used by the user to specify which of the available categories the user wants to check
const categorySelector = document.getElementById("category");

categorySelector.addEventListener("change", () => {
    QueryHeadlines.filter.category = categorySelector.value;
    currentCategory = categorySelector.options[categorySelector.selectedIndex].text
    updateHeadlines()
});

// elements used by the user to perform a specific search
const searchField = document.getElementById("searchField");
const searchButton = document.getElementById("searchButton");

searchField.addEventListener("keydown", (event) => {
    if (event.code == "Enter") {
        QueryHeadlines.filter.q = searchField.value;
        updateHeadlines();
        searchField.value = "";
    }
});
searchButton.addEventListener("click", () => {
    QueryHeadlines.filter.q = searchField.value;
    updateHeadlines();
    searchField.value = "";

});

// buttons using country flag used to perform a request based on a specific language, will override search by country.
const frButton = document.querySelector("#languageWrapper button:first-child");
const enButton = document.querySelector("#languageWrapper button:last-child");

frButton.addEventListener("click", () => {
    QueryHeadlines.filter.country = "";
    QueryHeadlines.filter.language = "fr";
    QueryEverything.filter.language = "fr";
    QueryEverything.filter.sortby = "publishedAt"
    updateHeadlines();
    updateNonHeadlines();
});
enButton.addEventListener("click", () => {
    QueryHeadlines.filter.country = "";
    QueryHeadlines.filter.language = "en";
    QueryEverything.filter.language = "en";
    QueryEverything.filter.sortby = "publishedAt"
    updateHeadlines();
    updateNonHeadlines();
});

/* ***** FUNCTIONS ***** */

//fetching API for headline news and displaying the result
async function updateHeadlines() {
    HeadlineGrid.textContent = "";
    QueryHeadlines.construct();
    try {
        let response = await fetch(QueryHeadlines.request);
        let dataHeadlines = await response.json();
        changeHeadlineTitle(dataHeadlines.articles);
        displayAllHeadlines(dataHeadlines.articles);
    } catch {
        HeadlineGrid.innerHTML = "<span>News API could not be reached</span>"
    }
    QueryHeadlines.filter.q = ""
};

//fetching API for non headline news and displaying the result
async function updateNonHeadlines() {
    ArticleGrid.textContent = "";
    QueryEverything.construct();
    try {
        let response = await fetch(QueryEverything.request);
        let dataEverything = await response.json();
        displayAllArticles(dataEverything.articles);
    } catch {
        ArticleGrid.innerHTML = "<span>News API could not be reached</span>"
    }
};

//adds a 0 in front of a date element (example: minutes) in case the element is between 0 and 9 and returns a corresponding string
function formatDateElements(dateElement) {
    return (dateElement.length == 1 ? `0${dateElement}` : dateElement);
}

//extract date elements of a date object to create a formated string, type of formating depends on a boolean argument
function extractDate(dateString, isSearchFormat = false) {
    let artDate = new Date(dateString);
    if (isSearchFormat) {
        return `${artDate.getFullYear()}-${formatDateElements(String(artDate.getMonth() + 1))}-${formatDateElements(String(artDate.getDate()))} ${formatDateElements(String(artDate.getHours()))}:${formatDateElements(String(artDate.getMinutes()))}`;
    } else {
        return `${artDate.getFullYear()}-${formatDateElements(String(artDate.getMonth() + 1))}-${formatDateElements(String(artDate.getDate()))}T${formatDateElements(String(artDate.getHours()))}:${formatDateElements(String(artDate.getMinutes()))}`;
    }
}

//takes an article and look for its author, if there is no specified author it will return a string indicating it, in other cases it will return the specified author
function extractAuthor(article) {
    return (article.author != null ? article.author : "auteur non indiqué")
}

//creates and returns an article tag and all its children based on a article object to display
function createArticle(article) {
    let newArticleDiv = document.createElement("article");
    let newArticleHeader = document.createElement("header");
    let imageContainer = document.createElement("div");
    imageContainer.classList.add("imgContainer");
    let newArticleFooter = document.createElement("footer");


    let newArticleTitle = document.createElement("h4");
    newArticleTitle.textContent = article.title;

    let newArticleDate = document.createElement("span");
    newArticleDate.textContent = article.publishedAt;
    newArticleDate.textContent = extractDate(article.publishedAt, true);

    let newArticleAuthor = document.createElement("span");
    newArticleAuthor.textContent = extractAuthor(article);


    let newArticleDescription = document.createElement("p");
    newArticleDescription.textContent = article.description;


    let newArticleImage = document.createElement("img");
    newArticleImage.src = article.urlToImage;
    newArticleImage.alt = "aucune image associée";

    let newArticleSource = document.createElement("span");
    newArticleSource.textContent = article.source.name;

    let newArticleUrl = document.createElement("a");
    newArticleUrl.href = article.url;
    newArticleUrl.textContent = "consulter l'article"

    newArticleHeader.append(newArticleAuthor, newArticleDate)
    imageContainer.appendChild(newArticleImage);
    newArticleFooter.append(newArticleUrl, newArticleSource)

    newArticleDiv.append(newArticleHeader, imageContainer, newArticleTitle, newArticleDescription, newArticleFooter)
    return newArticleDiv;
}

//Take an array of articles and displays them in the grid section dedicated to specific news
function displayAllArticles(articles) {
    articles.forEach(article => {
        ArticleGrid.appendChild(createArticle(article));
    });
}

//Take an array of articles and displays them in the grid section dedicated to headlines and user search requests
function displayAllHeadlines(articles) {
    articles.forEach(article => {
        HeadlineGrid.appendChild(createArticle(article));
    });
}

//change the title of the headline section to indicate what overall fetch request was for the currently displayed articles
function changeHeadlineTitle(articleArray) {
    if (articleArray.length > 1) {
        HeadlineTitle.textContent = `Les ${articleArray.length} dernières actualitées${getCountryMsg()}${getLanguageMsg()}${getCategoryMsg()}${getSearchMsg()}`
    } else if (articleArray.length == 1) {
        HeadlineTitle.textContent = `La dernière actualitée${getCountryMsg()}${getLanguageMsg()}${getCategoryMsg()}${getSearchMsg()}`
    }
    else {
        HeadlineTitle.textContent = `Aucune actualitée trouvée${getCountryMsg()}${getLanguageMsg()}${getCategoryMsg()}${getSearchMsg()}`
    }
}

//returns a string based on the country used for the fetching request
function getCountryMsg() {
    switch (QueryHeadlines.filter.country) {

        case "fr":
            return " de médias français";
            break;
        case "gb":
            return " de médias anglais";
            break;
        case "us":
            return " de médias américains";
            break;
        default:
            return "";
    }
}

//returns a string based on the language used for the fetching request
function getLanguageMsg() {
    switch (QueryHeadlines.filter.language) {
        case "fr":
            return " en français";
            break;
        case "en":
            return " en anglais";
            break;
        default:
            return "";
    }
}

//returns a string based on the category that was used for the fetching request
function getCategoryMsg() {
    return (QueryHeadlines.filter.category == "" ? " toutes catégories confondues" : ` dans la catégorie ${currentCategory}`)
}

//returns a string based on the search request that was used for the fetching request
function getSearchMsg() {
    return (QueryHeadlines.filter.q == "" ? "" : ` pour la recherche "${QueryHeadlines.filter.q}"`)
}
/* ***** INITIALIZATION ***** */

updateHeadlines();
updateNonHeadlines();

console.log("Frontend JS loaded successfully.");

//eventListener for random button
document.getElementById("generateSuggestionBtn").addEventListener("click", function () {
    console.log("Generate Suggestion button clicked.");
    let result = document.getElementById("suggestionResult");
    result.hidden = false;
});

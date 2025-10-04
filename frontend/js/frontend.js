console.log("Frontend JS loaded successfully.");

//eventListener for random button
document.getElementById("generateSuggestionBtn").addEventListener("click", async () => {
    console.log("Generate Suggestion button clicked.");
    let resultContainer = document.getElementById("suggestionResult");
    resultContainer.hidden = false;
    let resultPoster = document.getElementById("suggestionPoster");
    let resultTitle = document.getElementById("suggestionTitle");
    let resultReleaseDate = document.getElementById("suggestionReleaseDate");
    let resultDescription = document.getElementById("suggestionDescription");
    let resultProviders = document.getElementById("suggestionProviders");
    //TODO: Fetch random suggestion from backend

    let suggestion = await fetch('/api/get-random-movie').then(response => response.json())
    // debugger;
    resultPoster.innerHTML = `<img src="${suggestion.poster_path}" alt="Poster Image" />`;
    resultTitle.innerText = suggestion.title;
    resultReleaseDate.innerText = suggestion.release_date.split("-")[0];
    resultDescription.innerText = suggestion.overview;

    //clear previous providers
    resultProviders.innerHTML = "";
    //add new providers
    for (let provider of suggestion.providers) {
        let img = document.createElement("img");
        img.src = provider.logo_path;
        img.alt = provider.name;
        document.getElementById("suggestionProviders").appendChild(img);
    }

    // Ensure the newly revealed suggestion is scrolled into view for the user
    requestAnimationFrame(() => {
        resultContainer.scrollIntoView({ behavior: "smooth", block: "center" });
    });

});

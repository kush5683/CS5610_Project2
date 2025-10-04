console.log("Frontend JS loaded successfully.");

//eventListener for random button
document.getElementById("generateSuggestionBtn").addEventListener("click", function () {
    console.log("Generate Suggestion button clicked.");
    let resultContainer = document.getElementById("suggestionResult");
    resultContainer.hidden = false;
    let resultPoster = document.getElementById("suggestionPoster");
    let resultTitle = document.getElementById("suggestionTitle");
    let resultReleaseDate = document.getElementById("suggestionReleaseDate");
    let resultDescription = document.getElementById("suggestionDescription");
    let resultProviders = document.getElementById("suggestionProviders");
    //TODO: Fetch random suggestion from backend

    debugger;
    let suggestion = {
    "id": 617126,
    "title": "The Fantastic 4: First Steps",
    "overview": "Against the vibrant backdrop of a 1960s-inspired, retro-futuristic world, Marvel's First Family is forced to balance their roles as heroes with the strength of their family bond, while defending Earth from a ravenous space god called Galactus and his enigmatic Herald, Silver Surfer.",
    "poster_path": "https://image.tmdb.org/t/p/w500/cm8TNGBGG0aBfWj0LgrESHv8tir.jpg",
    "release_date": "2025-07-22",
    "vote_count": 1780,
    "providers": [
      {
        "name": "Amazon Video",
        "logo_path": "https://image.tmdb.org/t/p/w500/seGSXajazLMCKGB5hnRCidtjay1.jpg"
      },
      {
        "name": "Apple TV",
        "logo_path": "https://image.tmdb.org/t/p/w500/9ghgSC0MA082EL6HLCW3GalykFD.jpg"
      },
      {
        "name": "Fandango At Home",
        "logo_path": "https://image.tmdb.org/t/p/w500/19fkcOz0xeUgCVW8tO85uOYnYK9.jpg"
      }
    ]
  }
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

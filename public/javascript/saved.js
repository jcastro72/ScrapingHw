function displaySaved() {
    $.getJSON("/saved/all", function (data) {
        $("#nyt-0").empty();
        $("#nyt-1").empty();
        $("#nyt-2").empty();
        $("#total-number").text(data.length);
        for (var i = 0; i < data.length; i++) {
            var mainDiv = $("<div>");
            mainDiv.addClass("card grey lighten-2");
            mainDiv.attr("id", "main-" + data[i]._id);
            var cardContentDiv = $("<div>");
            cardContentDiv.addClass("card-content black-text");
            var spanTitle = $("<span>");
            spanTitle.addClass("card-title");
            spanTitle.attr("data-id", data[i]._id);
            spanTitle.attr("id", "title-" + data[i]._id);
            spanTitle.text(data[i].title);
            var p = $("<p>");
            p.text(data[i].summary);
            p.attr("id", "summary-" + data[i]._id);
            cardContentDiv.append(spanTitle);
            cardContentDiv.append(p);
            var cardActionDiv = $("<div>");
            cardActionDiv.addClass("card-action");
            var a = $("<a>");
            a.attr("href", data[i].link);
            a.attr("id", "link-" + data[i]._id);
            a.text("Go to the article");
            cardActionDiv.append(a);
            var button = $("<a>");
            button.addClass("waves-effect waves-light white btn create-note modal-trigger");
            button.attr("data-id", data[i]._id);
            button.attr("data-target", "notes");
            button.text("Create Notes");
            var deleteArticle = $("<a>");
            deleteArticle.addClass("waves-effect waves-light white btn delete-button");
            deleteArticle.attr("id", data[i]._id);
            deleteArticle.text("Delete");
            var byline = $("<p>");
            byline.text(data[i].byline);
            cardActionDiv.append(byline);
            cardActionDiv.append(button);
            cardActionDiv.append(deleteArticle);
            mainDiv.append(cardContentDiv);
            mainDiv.append(cardActionDiv);

            $("#nyt-" + String(i % 3)).append(mainDiv);
        }
    });
}

function deletenote(thisId) {
    var data = {
        "_id": thisId
    };
    console.log(data);
    $.ajax({
        type: "DELETE",
        url: "/deletenote",
        data: data,
        success: function (data, textStatus) {
            $("#" + thisId).remove();
        }
    })
}

$(document).ready(function () {
    $('.slider').slider();
    $(".button-collapse").sideNav();
    $('.modal').modal();

    // When click on savearticle button
    $(document).on('click', '.save-button', function () {
        var thisId = $(this).attr("id");
        var summary = $("#summary-" + thisId).text();
        var title = $("#title-" + thisId).text();
        var link = $("#link-" + thisId).attr('href');
        var byline = $("#byline-" + thisId).text();
        var data = {
            "id": thisId,
            "summary": summary,
            "title": title,
            "link": link,
            "byline": byline
        };
        $.ajax({
            type: "POST",
            url: "/save",
            data: data,
            dataType: "json",
            success: function (data, textStatus) {
                console.log(data);
            }
        });
    });
    // When click on delete article button
    $(document).on('click', '.delete-button', function () {
        var thisId = $(this).attr("id");
        var summary = $("#summary-" + thisId).text();
        var title = $("#title-" + thisId).text();
        var link = $("#link-" + thisId).attr('href');
        var byline = $("#byline-" + thisId).text();
        var data = {
            "_id": thisId
        };
        $.ajax({
            type: "DELETE",
            url: "/delete",
            data: data,
            success: function (data, textStatus) {
                $("#main-" + thisId).remove();
            }
        })
    });

    // create note
    $(document).on("click", ".create-note", function (data) {
        // alert($(this).attr("data-id"));
        $("#savenote").attr("data-id", $(this).attr("data-id"));
        // <div id="display-note"></div>
        let aid = $(this).attr("data-id");
        let title = "Notes for the Article: " + aid;
        $("#display-title").empty();
        $("#display-title").text(title);
        $("#textarea1").val("");
        $.getJSON("/notes/" + aid, function (data) {
            if(data.length) {
                console.log(data);
                let notetext = "Notes: " + data[0].body;
                $("#display-note").empty();
                let noteList = $("<ul>");
                noteList.addClass("collection with-header");
                let hli = $("<li>");
                hli.addClass("collection-header")
                hli.text("Notes");
                noteList.append(hli);
            
                for (let i = 0; i < data.length; i++) {
                    let ili = $("<li>");
                    ili.attr("id", data[i]._id);
                    ili.addClass("collection-item");

                    let idiv = $("<div>");
                    idiv.text(data[i].body);

                    let adelete = $("<a>");
                    adelete.addClass("secondary-content");
                    adelete.attr("note-id", data[i]._id);
                    adelete.attr("href", "#");
                    adelete.attr("onclick", 'deletenote("' + data[i]._id + '")');
                    let xdelete = $("<i>");
                    xdelete.addClass("material-icons");
                    xdelete.attr("note-id", data[i]._id);
                    xdelete.html("delete");
                    adelete.append(xdelete);
                    idiv.append(adelete);
                    ili.append(idiv);
                    noteList.append(ili);
                }
                $("#display-note").append(noteList);
            }
        });
    });

    // When you click the savenote button
    $(document).on("click", "#savenote", function () {
        // Grab the id associated with the article from the submit button
        // get the user input value 
        var thisId = $(this).attr("data-id");
        var text = $("#textarea1").val();
        console.log(thisId);
        // Run a POST request to change the note, using what's entered in the inputs
        $.ajax({
            type: "POST",
            url: "/notes",
            data: {
                "article_id": thisId,
                "body": text
            },
            success: function (data, textStatus, jqXHR) {
                console.log(data);
                $("#textarea1").val("");
            }
        });
    });
    // delete note button
    $(document).on("click", "#deletenote", function () {
        // Run a DELETE request to change the note, using what's entered in the inputs
        $.ajax({
            type: "DELETE",
            url: "/deletenote",
            data: data,
            success: function (data, textStatus) {
                $("#display-note").remove();
            }
        });
    });
});
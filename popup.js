function convertToCSV(args) {
	console.log("test", args);

	var result, lineDelimiter, data, i;

	data = args.data || null;
	if (data == null || !data.length) {
		return null;
	}

	lineDelimiter = '\n';
	result = '';
	console.log("length ", data.length);

	for (i = 0; i < data.length; i++) {
		result += data[i];
		result += lineDelimiter;
	}
	console.log(result);
	return result;
}

function downloadCSV(args) {
	var data, filename, link;

	var csv = convertToCSV({ data: args });
	data = args.data;
	if (csv == null) return;

	filename = 'export.csv';

	if (!csv.match(/^data:text\/csv/i)) {
		csv = 'data:text/csv;charset=utf-8,' + csv;
	}
	data = encodeURI(csv);

	link = document.createElement('a');
	link.setAttribute('href', data);
	link.setAttribute('download', filename);
	link.click();
}

window.onload = function () {
	document.getElementById('drive_button').addEventListener('click', function () {
		window.open("https://drive.google.com/drive/my-drive");
	});

	chrome.storage.local.get(['sign_in'], function (result) {
		if (result['sign_in'] === false) {
			//console.log("click sign in button");
			document.getElementById('hidden_button').innerHTML += "<button style='width:270px' id='authorize_button' style='display: none;'>Sign in Chrome</button>";
			document.getElementById('authorize_button').addEventListener('click', function () {
				console.log("click sign in button");
				chrome.identity.getAuthToken({ interactive: true }, function (token) {
					console.log(token);
				});
			});
		}
	});

	document.getElementById('POPUP').addEventListener('click', function () {
		var popup = document.getElementById("myPopup");
		popup.classList.toggle("show");
	});


	chrome.storage.local.get(['log'], function (result) {
		console.log(result['log']);
		var i;
		var length = Math.min(result['log'].length, 10);

		for (i = 0; i < length; i++) {
			document.getElementById('log').innerHTML += "<p>"
			document.getElementById('log').innerHTML += result['log'][i];
			document.getElementById('log').innerHTML += "</p>"
		}

		document.getElementById('export_button').addEventListener('click', function () {
			console.log("test", result['log']);
			downloadCSV(result['log']);
		})
	});
};




// http://html5doctor.com/using-modernizr-to-detect-html5-features-and-provide-fallbacks/
/** 
 * Taskboard namespace et celui d'index DB de l'application
 */
var Taskboard = {};

Taskboard.COL_TODO="#todo";
Taskboard.COL_INPROGRESS="#inprogress";
Taskboard.COL_DONE="#done";

/*************************************************************************
 * JQuery actions
 *************************************************************************/
$(document).ready(function() {
   
	// Initialisation de IndexDB
	Taskboard.openDB();
	
	$("form #add").click(function(){
		Taskboard.isOnline(submitTaskCallBack);
    });
	
	$("form #sync").click(function(){
		Taskboard.isOnline(syncTaskCallBack);
    });
	
	$("form #reset").click(function(){
		Taskboard.reset();
    });
	
	$("#todo a").each(function(index, value){
		$(this).click(function(){
			Taskboard.isOnline(todoToInProgressCallBack,$(this).parent().attr('id'));
		});
    });
	
	$("#inprogress a").each(function(index, value){
		$(this).click(function(){
			Taskboard.isOnline(inProgressToDoneCallBack,$(this).parent().attr('id'));
		});
    });
	
	$("#done a").each(function(index, value){
		$(this).click(function(){
			Taskboard.isOnline(doneToDeleteCallBack,$(this).parent().attr('id'));
		});
    });
});
    
/**
 * Gestion de la connection internet OFF/ON line
 */
Taskboard.isOnline = function(callBack,params) {

	$.ajax({
        url: 'online',
        type: "GET",

        timeout : 5000,
        error: function(){
        	callBack(false,params);
        },
        success: function (data){
        	callBack(true,params);
        }
    });    
};


/*************************************************************************
 * Reset
 *************************************************************************/
Taskboard.reset = function (){
	Taskboard.deleteAllTasksFromDataBase();
	location.href= 'reset';
};


/*************************************************************************
 * Submit TASK
 *************************************************************************/
// Réinitialise l'input text
Taskboard.resetForm = function(){
	$("#label").val("");
};


// http://stackoverflow.com/questions/9066232/html-required-not-working-with-onclick
Taskboard.isFormValide = function(){
	return document.forms['addForm'].checkValidity();
};

function submitTaskCallBack (isonline){

	if(Taskboard.isFormValide()){
		if(isonline){
			var label = $("#label").val();
			Taskboard.submitTaskOnline(label); 	
		}else{
			Taskboard.submitTaskOffline();
		}
	}
};

Taskboard.submitTaskOnline = function(label){
	//	document.forms['addForm'].submit();
	
    $.ajax({
        url: 'add',
        type: "POST",
        data: {label:label},
        error: function(){
            alert("Une erreur inattendue s'est produite");
        },
        success: function (data){     
        	Taskboard.resetForm();
          var task = $.parseJSON(data);
        	var id = task.id;
        	var label = task.label;
        	Taskboard.addTaskToColumn(id,label,Taskboard.COL_TODO,true);
        	
        }
    });    
};

Taskboard.submitTaskOffline = function(){
	
	var id = new Date().getTime();
	var label = $("#label").val();
	
	var db = Taskboard.tasksDB;
	var trans = db.transaction([ "task" ], transactionDB.READ_WRITE, 0);
	var store = trans.objectStore("task");
	var request = store.put({
		"label" : label,
		"id" : id
	});
	
	request.onsuccess = function(e) {
		Taskboard.resetForm();
		Taskboard.addTaskToColumn(id,label,Taskboard.COL_TODO,false);
		Taskboard.getAllTasksFromDataBase(initSyncButtonCallBack);
	};

	request.onerror = Taskboard.onerrordb;
};


/*******************************************************************************
 * ToDo -> In Progres
 ******************************************************************************/
function todoToInProgressCallBack(isonline,id){
	if(isonline){
		Taskboard.todoToInProgressOnline(id);
	}else{
		Taskboard.todoToInProgressOffline(id);
	}
};

Taskboard.todoToInProgressOnline = function(id){
	// POST au serveur
    $.ajax({
        url: 'inProgress',
        type: "POST",
        data: {id:id},
        error: function(){
        
        	alert("Une erreur inattendue s'est produite");
        },
        success: function (data){
        
        	Taskboard.copyTaskToColumn(id,Taskboard.COL_INPROGRESS);
        }
    });    
};

Taskboard.todoToInProgressOffline = function(){
	alert("Opération non autorisée off-line");
};

/*************************************************************************
 * In Progres -> Done
 *************************************************************************/
function inProgressToDoneCallBack(isonline,id){
	if(isonline){
		Taskboard.inProgressToDoneOnline(id);
	}else{
		Taskboard.inProgressToDoneOffline(id);
	}
};

Taskboard.inProgressToDoneOnline = function(id){
	// POST au serveur
    $.ajax({
        url: 'done',
        type: "POST",
        data: {id:id},
        error: function(){
        	alert("Une erreur inattendue s'est produite");
        },
        success: function (data){
        	Taskboard.copyTaskToColumn(id,Taskboard.COL_DONE);
        }
    });    
};

Taskboard.inProgressToDoneOffline = function(){
	alert("Opération non autorisée off-line");
};

/*************************************************************************
 * Done -> Delete
 *************************************************************************/
function doneToDeleteCallBack(isonline,id){
	if(isonline){
		Taskboard.doneToDeleteCallBackOnline(id);
	}else{
		Taskboard.doneToDeleteCallBackOffline(id);
	}
};

Taskboard.doneToDeleteCallBackOnline = function(id){
	// POST au serveur
    $.ajax({
        url: 'remove',
        type: "POST",
        data: {id:id},
        error: function(){
        	alert("Une erreur inattendue s'est produite");
        },
        success: function (data){
        	Taskboard.removeTask(id);
        }
    });    
};

Taskboard.doneToDeleteCallBackOffline = function(){
	alert("Opération non autorisée off-line");
};


/*************************************************************************
 * CRUD de Task dans le DOM
 *************************************************************************/

/**
 * <p class="task" id="${task._id}" sync="true/false" draggable="true" ondragstart="Taskboard.drag(event)">
 *		${task.label}
 *		<a href="#">&gt;</a>
 * </p>
 */
Taskboard.createTask = function(id,label,sync){
	var template;
	
	if(sync){
		template = "<p class=\"task\" id=\"{0}\" sync=\"true\" draggable=\"true\" ondragstart=\"Taskboard.drag(event)\"><span>{1}</span><a href=\"#\"></a></p>";
	}
	else{
		template = "<p class=\"task\" id=\"{0}\" sync=\"false\" draggable=\"false\"><span>{1}</span><a href=\"#\"></a></p>";
	}
	
	template = template.replace('{0}',id);
	template = template.replace('{1}',label);
	
	return $(template);
};

// params :
// - id et labal de la tâche
// - colonne dans laquelle l'ajouter
// - sync indique si la tâche a été sauvegarder côté server
Taskboard.addTaskToColumn = function(id,label, colonne,sync){
	$task = Taskboard.createTask(id,label,sync);
	$action = $task.find("a");
	
	if(colonne == Taskboard.COL_TODO && sync){
		$action.text(">");
		$action.click(function(){
			Taskboard.isOnline(todoToInProgressCallBack,id);
	    });
		
		
	}else if(colonne == Taskboard.COL_INPROGRESS){
		$action.text(">");
		$action.click(function(){
			Taskboard.isOnline(inProgressToDoneCallBack,id);
	    });
		
	}else if(colonne == Taskboard.COL_DONE ){
		$action.text("x");
		$action.click(function(){
			Taskboard.isOnline(doneToDeleteCallBack,id);
	    });
	}
	
	$(colonne).append($task);
};

Taskboard.copyTaskToColumn = function (id, colonne){
	var task = $('#'+id);
	var task_id = id;
	var task_label = task.find('span').text();
	Taskboard.removeTask(id);
	Taskboard.addTaskToColumn(task_id,task_label,colonne,true);
};

Taskboard.removeTask = function (id){
	$('#'+id).remove();
};

/*************************************************************************
 * Waitbox (voir .toggle() de JQuery)
 *************************************************************************/
Taskboard.showWaitBox = function (){
	//$("#loading").css("display","block");
};

Taskboard.hideWaitBox = function (){
	//$("#loading").css("display","none");
};

/*************************************************************************
 * Gestion du Drag & Drop HTML5
 *************************************************************************/
//id de la tâche qu'on drag&drop
//=> fonctionne sous chrome & firefox
Taskboard.DRAG_AND_DROP_TASK_ID;

Taskboard.allowDrop = function (ev) {
	ev.preventDefault();
	
	var task = $("#"+Taskboard.DRAG_AND_DROP_TASK_ID+"");
	
	var src = task.parent().attr('id');
	var dest = ev.currentTarget.id;

	Taskboard.resetColumnsDragStyle();
		
	if(Taskboard.isDragAllowed(src,dest)){
		$("#"+dest+"").addClass("draggable");
	}else{
		$("#"+dest+"").addClass("notDraggable");
	}	
};


Taskboard.isDragAllowed = function (src,dest){
	if(Taskboard.COL_TODO.indexOf(src) !=-1 && Taskboard.COL_INPROGRESS.indexOf(dest) != -1){
		return true;
	}else if(Taskboard.COL_INPROGRESS.indexOf(src) !=-1 && Taskboard.COL_DONE.indexOf(dest) != -1){
		return true;
	}else{
		return false;
	}
};

Taskboard.drag = function drag(ev) {
	Taskboard.DRAG_AND_DROP_TASK_ID = ev.target.id;
	ev.dataTransfer.setData("Text",ev.target.id);
};

Taskboard.drop = function drop(ev) {
	ev.preventDefault();
	
	var task = $("#"+Taskboard.DRAG_AND_DROP_TASK_ID+"");
	
	var src = task.parent().attr('id');
	var dest = ev.currentTarget.id;

	if(Taskboard.isDragAllowed(src,dest)){
		// On provoque le lien
		task.find("a").trigger("click");
	}
	
	Taskboard.resetColumnsDragStyle();
	
};

Taskboard.resetColumnsDragStyle = function(){
	$("#columns .column").each(function(index, value){
		$(this).removeClass("notDraggable");
		$(this).removeClass("draggable");
    });
};


/*************************************************************************
 * IndexDB HTML 5
 * old spec ~ http://www.html5rocks.com/en/tutorials/indexeddb/todo/ 
 * https://developer.mozilla.org/en-US/docs/IndexedDB/Using_IndexedDB
 *************************************************************************/

//Taking care of the browser-specific prefixes.  
//La base de donnée HTML5 du Navigateur
var indexedDB = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB;
var transactionDB = window.IDBTransaction || window.webkitIDBTransaction;
var keyRangeDB = window.IDBKeyRange || window.webkitIDBKeyRange;
var versionDB = 45;

// Toutes les erreures sont redirigées vers la consoles
Taskboard.onErrorDB = function(e) {
	console.log(e);
};

// Post au serveur toutes les tâches à synchroniser
function postAllTaskToServerCallBack (tasks){
	
	for(var iTask= 0; iTask < tasks.length; iTask++){
		Taskboard.removeTask(tasks[iTask].id);
		Taskboard.submitTaskOnline(tasks[iTask].label);
	}
};

function initTasksAndSyncButtonCallBack(tasks){
	initSyncButtonCallBack(tasks);
	initTaskNotSyncCallBack (tasks);
}

// Initialise la liste des tâches non synchronisée
function initTaskNotSyncCallBack (tasks){
	for(var iTask= 0; iTask < tasks.length; iTask++){
		Taskboard.addTaskToColumn(tasks[iTask].id,tasks[iTask].label,Taskboard.COL_TODO,false);
	}
};


// Initialise le bouton Synchroniser avec le nombre de tâches en base
function initSyncButtonCallBack (tasks){
	var sync = $("form #sync:first");
	sync.text("Synchroniser ("+tasks.length+" tâches)");
};


function syncTaskCallBack (isonline){
	
	if(isonline){
		Taskboard.getAllTasksFromDataBase(postAllTaskToServerCallBack);
		Taskboard.deleteAllTasksFromDataBase();
		initSyncButtonCallBack(new Array());
	}else{
		alert('Opération non autorisée off-line');
	}
};

// Ouverture de la base au lancement de l'appli
Taskboard.openDB = function() {
	
	// ouverture de la base de donnée de TaskBoard
	var request = indexedDB.open("tasks",versionDB);

	// Erreur à l'ouverture
	request.onfailure = Taskboard.onErrorDB;
	
	// If the version of the db changes, the onupgradeneeded callback is executed.
	// WebKit hasn't implemented the current version of the spec
	request.onupgradeneeded = function(e) {
		Taskboard.tasksDB = e.target.result; 
		Taskboard.tasksDB.deleteObjectStore("task");
		Taskboard.tasksDB.createObjectStore("task", {keyPath:'id'},true);
	};

	// If the open request is successful, the onsuccess callback is executed.
	request.onsuccess = function(e) {
		Taskboard.tasksDB = e.target.result;
		
		// Méthode old school pour Chrome
		if(versionDB != Taskboard.tasksDB.version){
			var request = Taskboard.tasksDB.setVersion(versionDB);
			request.onfailure = Taskboard.onErrorDB;
			request.onsuccess = function(e) {
				Taskboard.tasksDB = e.target.result.db;
				Taskboard.tasksDB.deleteObjectStore("task");
				Taskboard.tasksDB.createObjectStore("task", {keyPath:'id'},true);
				Taskboard.getAllTasksFromDataBase(initTasksAndSyncButtonCallBack);	
		    };
		    
		}else{
			Taskboard.getAllTasksFromDataBase(initTasksAndSyncButtonCallBack);			
		}
	};

	
};

// Renvoie toutes les tâches
Taskboard.getAllTasksFromDataBase = function(callBack) {
	var db = Taskboard.tasksDB;
	var trans = db.transaction([ "task" ], transactionDB.READ_WRITE, 0);
	var store = trans.objectStore("task");

	// Get everything in the store;
	var keyRange = keyRangeDB.lowerBound(0);
	var cursorRequest = store.openCursor(keyRange);
	var tasks = new Array();
	
	cursorRequest.onsuccess = function(e) {
		var result = e.target.result;
		
		if (result){
			var row = result.value;
			
			var task = new Object();
			task.id = row.id;
			task.label = row.label;
			tasks.push(task);
			result.continue();
		}else{
			callBack(tasks);
		};	
	};
	cursorRequest.onerror = Taskboard.onErrorDB;
};


// Supprime toutes les tâches de la base
Taskboard.deleteAllTasksFromDataBase = function() {
	var db = Taskboard.tasksDB;
	var trans = db.transaction([ "task" ], transactionDB.READ_WRITE, 0);
	var store = trans.objectStore("task");
	store.clear();
};
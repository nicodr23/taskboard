<!DOCTYPE HTML>
<%@ page language="java" contentType="text/html; charset=ISO-8859-1" pageEncoding="ISO-8859-1"%>
<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c" %>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
	<meta http-equiv="Content-Type" content="text/html; charset=ISO-8859-1" />
	<title>Taskboard</title>
	<link rel="icon" type="image/png" href="/images/task-icon.png" />
	<!-- JQuery pour les appels Ajax -->
	<script type="text/javascript" src="scripts/jquery-1.7.2.js"></script>
	<!-- TaskBord -->
	<script type="text/javascript" src="scripts/taskboard.js" charset="utf-8"></script>
	<link rel="stylesheet" href="styles/taskboard.css" />
	
</head>
<body>
	<div id="title">
		TaskBoard
	</div>

	<div id="content">
		<!-- Formulaire de saisie -->	
		<form name="addForm" method="post" action="add">
			<p>Tâche :</p>
			<input type="text" name="label" id="label" size="50" placeholder="Entrez le titre de votre tâche" required pattern="(.){3,}"/>
			<a href="#" class="button blue" id="add">Ajouter</a>
			<a href="#" class="button red" id="sync">...</a>
			<a href="#" class="button orange" id="reset">Réinitialiser</a>
		</form>
		
		<!-- Affichage des tâches -->	
		<div id="columns">
			<div id="todo" class="column" ondrop="Taskboard.drop(event)" ondragover="Taskboard.allowDrop(event)">
				<h1>To Do</h1>
				<c:forEach items="${todo}" var="task">
					<p class="task" id="${task._id}" sync="true" draggable="true" ondragstart="Taskboard.drag(event)">
						<span>${task.label}</span>
						<a href="#" >&gt;</a>
					</p>
				</c:forEach>
			</div>
			<div id="inprogress" class="column" ondrop="Taskboard.drop(event)" ondragover="Taskboard.allowDrop(event)">
				<h1>In Progress</h1>
				<c:forEach items="${inProgress}" var="task">
					<p class="task" id="${task._id}" sync="true" draggable="true" ondragstart="Taskboard.drag(event)">
						<span>${task.label}</span>
						<a href="#">&gt;</a>
					</p>
				</c:forEach>
			</div>
			<div id="done" class="column last" ondrop="Taskboard.drop(event)" ondragover="Taskboard.allowDrop(event)">
				<h1>Done</h1>
				<c:forEach items="${done}" var="task">
					<p class="task" id="${task._id}" sync="true" draggable="true" ondragstart="Taskboard.drag(event)">
						<span>${task.label}</span>
						<a href="#">x</a>
					</p>
				</c:forEach>
			</div>
		</div>
	</div>
		
	<!-- <div id="loading">
		<div id="loading_1" class="loading"/>
		<div id="loading_2" class="loading"/>
		<div id="loading_3" class="loading"/>
	</div> -->
	
</body>
</html>
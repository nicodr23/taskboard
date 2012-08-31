package com.taskboard.presentation;

import java.io.IOException;
import java.io.PrintWriter;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.bson.types.ObjectId;

import com.taskboard.business.TaskboardService;
import com.taskboard.data.Task;

/**
 * Servlet handling task adding
 */
@WebServlet("/add")
public class AddTaskServlet extends HttpServlet {
	private static final long serialVersionUID = 1L;

	/**
	 * Adds a new task with the provided label
	 */
	protected void service(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		response.setContentType("text/plain");
		response.setHeader("Cache-Control", "no-cache");
		PrintWriter out = response.getWriter();

		try {
			Task task = TaskboardService.get().add(request.getParameter("label"));
			String json = "{\"id\":\"" + ((ObjectId) task.get("_id")).toString()+ "\"" +", \"label\":\""+ task.get("label")+"\"}";
			out.write(json);
		} finally {
			out.close();
		}
	}

}

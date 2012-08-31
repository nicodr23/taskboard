package com.taskboard.presentation;

import java.io.IOException;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

/**
 * Is server ON line or NOT
 */
@WebServlet("/online")
public class OnLineServlet extends HttpServlet {
	private static final long serialVersionUID = 1L;

	/**
	 * Gets the tasks
	 */
	protected void service(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		response.setContentType("text/plain");
		response.setHeader("Cache-Control", "no-cache");
        response.getWriter().write("Server online");
        response.setStatus(200);
	}

}

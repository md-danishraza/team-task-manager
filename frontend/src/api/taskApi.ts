import { createApi } from "@reduxjs/toolkit/query/react";
import { axiosBaseQuery } from "./baseQuery";
import type {
  Task,
  CreateTaskData,
  UpdateTaskData,
  TaskStatus,
} from "../types";

export const taskApi = createApi({
  reducerPath: "taskApi",
  baseQuery: axiosBaseQuery(),
  tagTypes: ["Task", "Tasks"],
  endpoints: (builder) => ({
    getTasks: builder.query<
      { tasks: Task[] },
      { projectId?: string; status?: TaskStatus; assignedTo?: string }
    >({
      query: (filters) => {
        const params = new URLSearchParams();
        if (filters.projectId) params.append("projectId", filters.projectId);
        if (filters.status) params.append("status", filters.status);
        if (filters.assignedTo) params.append("assignedTo", filters.assignedTo);
        return {
          url: `/tasks?${params.toString()}`,
          method: "GET",
        };
      },
      providesTags: ["Tasks"],
    }),
    getTask: builder.query<{ task: Task }, string>({
      query: (id) => ({
        url: `/tasks/${id}`,
        method: "GET",
      }),
      providesTags: (result, error, id) => [{ type: "Task", id }],
    }),
    createTask: builder.mutation<
      { message: string; task: Task },
      CreateTaskData
    >({
      query: (data) => ({
        url: "/tasks",
        method: "POST",
        data,
      }),
      invalidatesTags: ["Tasks"],
    }),
    updateTask: builder.mutation<
      { message: string; task: Task },
      { id: string; data: UpdateTaskData }
    >({
      query: ({ id, data }) => ({
        url: `/tasks/${id}`,
        method: "PUT",
        data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Task", id },
        "Tasks",
      ],
    }),
    updateTaskStatus: builder.mutation<
      { message: string; task: Task },
      { id: string; status: TaskStatus }
    >({
      query: ({ id, status }) => ({
        url: `/tasks/${id}/status`,
        method: "PATCH",
        data: { status },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Task", id },
        "Tasks",
      ],
    }),
    deleteTask: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/tasks/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Tasks"],
    }),
  }),
});

export const {
  useGetTasksQuery,
  useGetTaskQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useUpdateTaskStatusMutation,
  useDeleteTaskMutation,
} = taskApi;

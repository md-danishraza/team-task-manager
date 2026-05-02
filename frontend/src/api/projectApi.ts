import { createApi } from "@reduxjs/toolkit/query/react";
import { axiosBaseQuery } from "./baseQuery";
import type { Project, CreateProjectData, ProjectMember } from "../types";

export const projectApi = createApi({
  reducerPath: "projectApi",
  baseQuery: axiosBaseQuery(),
  tagTypes: ["Project", "Projects"],
  endpoints: (builder) => ({
    getProjects: builder.query<{ projects: Project[] }, void>({
      query: () => ({
        url: "/projects",
        method: "GET",
      }),
      providesTags: ["Projects"],
    }),
    getProject: builder.query<{ project: Project; userRole: string }, string>({
      query: (id) => ({
        url: `/projects/${id}`,
        method: "GET",
      }),
      providesTags: (result, error, id) => [{ type: "Project", id }],
    }),
    createProject: builder.mutation<
      { message: string; project: Project },
      CreateProjectData
    >({
      query: (data) => ({
        url: "/projects",
        method: "POST",
        data,
      }),
      invalidatesTags: ["Projects"],
    }),
    updateProject: builder.mutation<
      { message: string; project: Project },
      { id: string; data: Partial<CreateProjectData> }
    >({
      query: ({ id, data }) => ({
        url: `/projects/${id}`,
        method: "PUT",
        data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Project", id },
        "Projects",
      ],
    }),
    deleteProject: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/projects/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Projects"],
    }),
    getProjectMembers: builder.query<{ members: ProjectMember[] }, string>({
      query: (id) => ({
        url: `/projects/${id}/members`,
        method: "GET",
      }),
      providesTags: (result, error, id) => [{ type: "Project", id }],
    }),
    addMember: builder.mutation<
      { message: string; member: ProjectMember },
      { id: string; email: string; role?: string }
    >({
      query: ({ id, email, role }) => ({
        url: `/projects/${id}/members`,
        method: "POST",
        data: { email, role },
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Project", id }],
    }),
    removeMember: builder.mutation<
      { message: string },
      { id: string; memberId: string }
    >({
      query: ({ id, memberId }) => ({
        url: `/projects/${id}/members/${memberId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Project", id }],
    }),
  }),
});

export const {
  useGetProjectsQuery,
  useGetProjectQuery,
  useCreateProjectMutation,
  useUpdateProjectMutation,
  useDeleteProjectMutation,
  useGetProjectMembersQuery,
  useAddMemberMutation,
  useRemoveMemberMutation,
} = projectApi;

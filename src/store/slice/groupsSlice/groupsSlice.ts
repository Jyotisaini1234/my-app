import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { BROKER_BASE } from '../../../utils/ApiConstants'; 
import { RootState } from '../../store';
import { GroupEntry, GroupsListResponse, GroupResponse, CreateGroupPayload, AddRemoveClientsPayload, RenameGroupPayload } from '../../../types/type';


export const groupApi = createApi({
  reducerPath: 'groupApi',
  baseQuery: fetchBaseQuery({
  baseUrl: BROKER_BASE,
  prepareHeaders: (headers, { getState }) => {
    const clientCode = (getState() as RootState).auth.user?.clientCode;
    if (clientCode) headers.set('X-Client-Code', clientCode.toUpperCase());
    return headers;
  },
}),
  tagTypes: ['Group'],

  endpoints: (builder) => ({
    fetchGroups: builder.query<Record<string, GroupEntry>, void>({
      query: () => '/api/group/list',
      transformResponse: (res: GroupsListResponse) => res.groups,
      providesTags: ['Group'],
    }),

    getGroup: builder.query<GroupEntry, string>({
      query: (groupName) => `/api/group/${groupName}`,
      transformResponse: (res: GroupResponse) => res.data,
      providesTags: (_result, _err, groupName) => [{ type: 'Group', id: groupName }],
    }),

    createGroup: builder.mutation<GroupResponse, CreateGroupPayload>({
      query: (body) => ({
        url: '/api/group/create',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Group'],
    }),

    addClientsToGroup: builder.mutation<GroupResponse, AddRemoveClientsPayload>({
      query: ({ groupName, client_codes }) => ({
        url: `/api/group/${groupName}/add-clients`,
        method: 'PATCH',
        body: { client_codes },
      }),
      invalidatesTags: ['Group'],
    }),

    removeClientsFromGroup: builder.mutation<GroupResponse, AddRemoveClientsPayload>({
      query: ({ groupName, client_codes }) => ({
        url: `/api/group/${groupName}/remove-clients`,
        method: 'PATCH',
        body: { client_codes },
      }),
      invalidatesTags: ['Group'],
    }),

    renameGroup: builder.mutation<GroupResponse, RenameGroupPayload>({
      query: ({ groupName, new_name }) => ({
        url: `/api/group/${groupName}/rename`,
        method: 'PATCH',
        body: { new_name },
      }),
      invalidatesTags: ['Group'],
    }),

    deleteGroup: builder.mutation<{ status: string; message: string }, string>({
      query: (groupName) => ({
        url: `/api/group/${groupName}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Group'],
    }),

  }),
});


export const {
  useFetchGroupsQuery,
  useGetGroupQuery,
  useCreateGroupMutation,
  useAddClientsToGroupMutation,
  useRemoveClientsFromGroupMutation,
  useRenameGroupMutation,
  useDeleteGroupMutation,
} = groupApi;
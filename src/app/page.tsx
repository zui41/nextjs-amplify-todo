'use client'

import React from 'react';
import {
  Box,
  Stack,
  TextField,
  Typography,
  Container,
  Paper,
  Button,
  Snackbar,
  Alert,
  Slide,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import * as Yup from "yup";
import { yupResolver } from '@hookform/resolvers/yup';
import { generateClient } from 'aws-amplify/api';
import { createTodo, deleteTodo } from '../graphql/mutations';
import { listTodos } from '../graphql/queries';
import { Amplify } from 'aws-amplify';
import amplifyconfig from '../amplifyconfiguration.json';
import { CreateTodoInput, Todo } from '../API';
import { withAuthenticator, WithAuthenticatorProps } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';

Amplify.configure(amplifyconfig);
const client = generateClient();

const Todo = ({ signOut, user}: WithAuthenticatorProps) => {
  const [todos, setTodos] = useState<Todo[] | CreateTodoInput[]>([]);

  const defaultValues = {
    name: "",
    description: "",
  };
  const validation = Yup.object().shape({
    name: Yup.string().required("タスク名を入力してください。"),
    description: Yup.string(),
  });
  const methods = useForm({
    defaultValues,
    resolver: yupResolver(validation),
  });
  const { handleSubmit, register, resetField, formState } = methods;
  const { errors } = formState;

  const fetchTodo = async () => {
    try {
      const todoData = await client.graphql({
        query: listTodos,
        variables: { filter: { userId: { eq: user?.userId } } },
      });
      const todos = todoData.data.listTodos.items;
      setTodos(todos);
    } catch (error) {
      console.error(error);
    }
  };

  const addTodo = async (data: Omit<CreateTodoInput, "userId">) => {
    try {
      const todoData = { ...data, userId: user?.userId ?? "" };
      await client.graphql({
        query: createTodo,
        variables: { input: todoData },
      });
      resetField("name");
      resetField("description");
      await fetchTodo();
    } catch (error) {
      console.log(error); 
    }
  };

  const handleDeleteTodo = async (id: string) => {
    try {
      await client.graphql({
        query: deleteTodo,
        variables: { input: { id } },
      });
      await fetchTodo();
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchTodo();
  }, []);

  return (
    <Box>
      <Container sx={{ p: '4vh' }}>
        <Typography variant="h4">
          TO DO
        </Typography>
        <Box textAlign="right" sx={{ mb: "1vh" }}>
          <Button variant="contained" onClick={signOut}>
          Sign Out
          </Button>
        </Box>
        <Paper elevation={6} sx={{ p: '2vh' }}>

          { /* Add Task */ }
          <FormProvider {...methods}>
            <form onSubmit={methods.handleSubmit(addTodo)}>
              <Stack mb={2}>
                <TextField
                  label="タスク名"
                  rows={1}
                  {...register("name")} 
                />
                {errors.name && (
                  <Typography variant="caption" color="error">
                    {errors.name.message}
                  </Typography>
                )}
              </Stack>
              <Stack mb={2}>
                <TextField
                  label="説明"
                  multiline
                  rows={4}
                  {...register("description")} 
                />
              </Stack>
              <Box textAlign="right">
                <Button type="submit" variant="outlined">追加</Button>
              </Box>
            </form>
          </FormProvider>

          { /* Todo List */ }
          {todos.map((todo) => (
            <Paper elevation={3} sx={{ p: "2vh", width: "100%", mt: "4vh" }}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="h6">
                    {todo.name}
                  </Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography sx={{ textAlign: 'center', lineHeight: '2.5' }}>
                    {todo.description}
                  </Typography>

                  <Stack direction="row" justifyContent="flex-end">
                    <Button
                      variant="text"
                      color="error"
                      onClick={() => {
                        if (typeof todo?.id === "string") {
                          handleDeleteTodo(todo.id)
                        }
                      }}
                    >
                      完了
                    </Button>
                  </Stack>
                </Stack>
            </Paper>
          ))}


        </Paper>
      </Container>
    </Box>
  );
}

export default withAuthenticator(Todo);

import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import toastr from "toastr";
import { Edit, Plus, Save, Search, X } from "lucide-react";

const fetchUsers = async () => {
  const response = await fetch("https://apivet.strategtic.com/api/user");
  const json = await response.json();
  if (!response.ok || json?.status === false) {
    throw new Error(json?.message || "No se pudo obtener los usuarios");
  }
  return json?.users ?? [];
};

function UserForm({ user, onSubmit, onCancel, isLoading }) {
  const [formData, setFormData] = useState({
    name: user?.name ?? "",
    email: user?.email ?? "",
    password: "",
  });

  useEffect(() => {
    setFormData({
      name: user?.name ?? "",
      email: user?.email ?? "",
      password: "",
    });
  }, [user]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!formData.name || !formData.email) return;
    if (!user && !formData.password) return;
    onSubmit(formData);
  };

  return (
    <Card className="mb-6 shadow-lg">
      <CardHeader>
        <CardTitle>{user ? "Editar usuario" : "Nuevo usuario"}</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="user-name">Nombre completo</Label>
              <Input
                id="user-name"
                placeholder="Alan Huidobro"
                value={formData.name}
                onChange={(event) => handleChange("name", event.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="user-email">Correo electrónico</Label>
              <Input
                id="user-email"
                type="email"
                placeholder="alan@gmail.com"
                value={formData.email}
                onChange={(event) => handleChange("email", event.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="user-password">
              {user ? "Contraseña (opcional)" : "Contraseña"}
            </Label>
            <Input
              id="user-password"
              type="password"
              placeholder={user ? "Dejar en blanco para mantenerla" : "123456"}
              value={formData.password}
              onChange={(event) => handleChange("password", event.target.value)}
              required={!user}
            />
            {user && (
              <p className="text-xs text-muted-foreground">
                Solo completa este campo si deseas cambiar la contraseña.
              </p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-wrap justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            className="bg-background hover:bg-muted-50"
            onClick={onCancel}
            disabled={isLoading}
          >
            <X className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading} className="bg-primary-600 hover:bg-primary-700">
            <Save className="w-4 h-4 mr-2" />
            {user ? "Actualizar" : "Guardar"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

export default function Usuarios() {
  const [showForm, setShowForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const queryClient = useQueryClient();

  const { data: users = [], isFetching, error } = useQuery({
    queryKey: ["usuarios"],
    queryFn: fetchUsers,
    staleTime: 1000 * 60,
    refetchOnWindowFocus: false,
  });

  const createMutation = useMutation({
    mutationFn: async (payload) => {
      const response = await fetch("https://apivet.strategtic.com/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await response.json();
      if (!response.ok || json?.status === false) {
        throw new Error(json?.message || "No se pudo crear el usuario");
      }
      return json;
    },
    onSuccess: () => {
      toastr.success("Usuario creado correctamente.");
      queryClient.invalidateQueries({ queryKey: ["usuarios"] });
      setShowForm(false);
      setSelectedUser(null);
    },
    onError: (err) => {
      toastr.error(err.message || "Error al crear el usuario.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }) => {
      const response = await fetch(`https://apivet.strategtic.com/api/updateUser/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await response.json();
      if (!response.ok || json?.status === false) {
        throw new Error(json?.message || "No se pudo actualizar el usuario");
      }
      return json;
    },
    onSuccess: () => {
      toastr.success("Usuario actualizado correctamente.");
      queryClient.invalidateQueries({ queryKey: ["usuarios"] });
      setShowForm(false);
      setSelectedUser(null);
    },
    onError: (err) => {
      toastr.error(err.message || "Error al actualizar el usuario.");
    },
  });

  const handleSubmit = (formData) => {
    if (selectedUser) {
      updateMutation.mutate({
        id: selectedUser.id,
        payload: {
          name: formData.name,
          email: formData.email,
          ...(formData.password ? { password: formData.password } : {}),
        },
      });
    } else {
      createMutation.mutate({
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });
    }
  };

  const handleEdit = (user) => {
    setSelectedUser(user);
    setShowForm(true);
  };

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    const term = searchTerm.trim().toLowerCase();
    if (!term) return users;
    return users.filter((user) => {
      return (
        user?.name?.toLowerCase().includes(term) ||
        user?.email?.toLowerCase().includes(term)
      );
    });
  }, [searchTerm, users]);

  const roleLabel = (user) => {
    if (user?.profileID === 1) return "Administrador";
    if (user?.profileID === null) return "Invitado";
    return "Usuario";
  };

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestión de usuarios</h1>
            <p className="text-gray-600 mt-1">Administra las cuentas que acceden al sistema.</p>
          </div>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={() => {
                setSelectedUser(null);
                setShowForm(true);
              }}
            >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo usuario
          </Button>
        </div>

        {!showForm ? (
          <>
            <Card className="shadow-lg mb-6">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Search className="w-5 h-5 text-gray-400" />
                  <Input
                    placeholder="Buscar por nombre o correo..."
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    className="max-w-md"
                  />
                </div>
              </CardHeader>
            </Card>

            {statusMessage && (
              <div
                role="status"
                aria-live="polite"
                className={`rounded-2xl border px-4 py-3 text-sm mb-4 ${
                  statusMessage.type === "error"
                    ? "border-destructive/60 bg-destructive/10 text-destructive"
                    : "border-emerald-200 bg-emerald-50 text-emerald-700"
                }`}
              >
                {statusMessage.message}
              </div>
            )}

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Lista de usuarios ({filteredUsers.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Correo</TableHead>
                        <TableHead>Rol</TableHead>
                        <TableHead>Creado</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((user) => (
                        <TableRow key={user.id} className="hover:bg-gray-50">
                          <TableCell className="font-semibold text-gray-900">{user.name}</TableCell>
                          <TableCell className="text-sm text-gray-600 break-words">{user.email}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{roleLabel(user)}</Badge>
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {user.created_at
                              ? new Date(user.created_at).toLocaleDateString("es-ES", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                })
                              : "—"}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(user)}>
                              <Edit className="w-4 h-4 text-primary-600" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {!isFetching && filteredUsers.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-10 text-gray-500">
                            No se encontraron usuarios
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <UserForm
            user={selectedUser}
            onSubmit={handleSubmit}
            onCancel={() => {
              setShowForm(false);
              setSelectedUser(null);
            }}
            isLoading={createMutation.isPending || updateMutation.isPending}
          />
        )}
      </div>
    </div>
  );
}

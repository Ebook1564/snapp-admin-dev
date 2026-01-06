"use client";

import React, { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import Image from "next/image";
import { EyeIcon, PencilIcon, TrashBinIcon, PlusIcon, ChevronDownIcon } from "@/icons";
import { Modal } from "../ui/modal";
import { useModal } from "@/hooks/useModal";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import Select from "../form/Select";

interface Game {
  uid: number;
  title: string;
  thumb: string;
  categories: string[];
  description: string;
  embedurl: string;
  orientation: string;
}

const initialFormData: Game = {
  uid: 0,
  title: "",
  thumb: "",
  categories: [],
  description: "",
  embedurl: "",
  orientation: "portrait",
};

export default function BasicTableOne() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modals
  const addModal = useModal();
  const deleteModal = useModal();
  const viewModal = useModal();

  // State
  const [viewGame, setViewGame] = useState<Game | null>(null);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState<Partial<Game>>({
    title: "",
    thumb: "",
    categories: [],
    description: "",
    embedurl: "",
    orientation: "portrait",
  });

  const fetchGames = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/games");
      const data = await response.json();
      if (data.success) {
        setGames(data.data);
      } else {
        setError(data.error || "Failed to fetch games");
      }
    } catch (err) {
      setError("An error occurred while fetching games");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGames();
  }, []);

  const handleRowClick = (game: Game) => {
    setViewGame(game);
    viewModal.openModal();
  };

  const handleViewClick = (e: React.MouseEvent, game: Game) => {
    e.stopPropagation();
    setViewGame(game);
    viewModal.openModal();
  };

  const handleEditClick = (e: React.MouseEvent, game: Game) => {
    e.stopPropagation();
    setSelectedGame(game);
    setFormData(game);
    setIsEditMode(true);
    addModal.openModal();
  };

  const handleDeleteClick = (e: React.MouseEvent, game: Game) => {
    e.stopPropagation();
    setSelectedGame(game);
    deleteModal.openModal();
  };

  const handleAddClick = () => {
    setSelectedGame(null);
    setFormData({
      title: "",
      thumb: "",
      categories: [],
      description: "",
      embedurl: "",
      orientation: "portrait",
    });
    setIsEditMode(false);
    addModal.openModal();
  };

  const handleInputChange = (field: keyof Game, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

const handleSave = async () => {
  try {
    // Generate slug from title (e.g., "My Game" -> "my-game")
    const slug = formData.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || '';
    
    const payload = {
      ...formData,
      slug,
      categories: formData.categories?.filter((c: string) => c.trim() !== "") || [],
      uid: isEditMode ? selectedGame?.uid : undefined, // Auto-generate on add
    } as Partial<Game & { slug: string }>;

    const url = isEditMode ? `/api/gamecollection/${selectedGame?.uid}` : "/api/gamecollection";
    const method = isEditMode ? "PATCH" : "POST";

    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (data.success) {
      await fetchGames(); // Refresh table
      addModal.closeModal();
      alert(isEditMode ? "Game updated!" : "Game added to collection!");
    } else {
      alert(data.error || "Failed to save");
    }
  } catch (err: any) {
    alert(`Error: ${err.message}`);
  }
};


  const handleDelete = async () => {
    if (selectedGame) {
      try {
        console.log(`Deleting game: ${selectedGame.uid}`);
        const response = await fetch(`/api/games/${selectedGame.uid}`, {
          method: "DELETE",
        });

        const data = await response.json();
        if (data.success) {
          await fetchGames();
          deleteModal.closeModal();
          setSelectedGame(null);
          alert("Game deleted successfully!");
        } else {
          console.error("Delete failed:", data.error);
          alert(data.error || "Failed to delete game");
        }
      } catch (err: any) {
        console.error("Delete error:", err);
        alert(`An error occurred while deleting game: ${err.message}`);
      }
    }
  };

  return (
    <>
      <div className="rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 shadow-sm">
        {/* Header */}
        <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Games Management
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Manage all integrated games in the system
            </p>
          </div>

          <Button
            onClick={handleAddClick}
            className="inline-flex items-center gap-2"
          >
            <PlusIcon className="w-4 h-4" />
            Add New Game
          </Button>
        </div>

        {/* Table */}
        <div className="max-w-full overflow-x-auto">
          <Table>
            <TableHeader className="border-gray-100 dark:border-gray-800 border-y bg-gray-50 dark:bg-gray-800/50">
              <TableRow>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Game
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Categories
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Orientation
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Actions
                </TableCell>
              </TableRow>
            </TableHeader>

            <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
              {games.map((game) => (
                <TableRow
                  key={game.uid}
                  className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                  onClick={() => handleRowClick(game)}
                >
                  <TableCell className="px-5 py-4 sm:px-6 text-start">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                        <Image
                          width={48}
                          height={48}
                          src={game.thumb || "/images/placeholder.svg"}
                          alt={game.title || "Game"}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                          {game.title || "Untitled Game"}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-700 text-start text-theme-sm dark:text-gray-300 font-medium">
                    {game.categories?.join(', ') || "N/A"}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-600 text-start text-theme-sm dark:text-gray-400">
                    {game.orientation || "N/A"}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => handleViewClick(e, game)}
                        className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 transition-colors"
                        aria-label="View game"
                        title="View details"
                      >
                        <EyeIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => handleEditClick(e, game)}
                        className="p-2 rounded-lg text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20 transition-colors"
                        aria-label="Edit game"
                        title="Edit game"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteClick(e, game)}
                        className="p-2 rounded-lg text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors"
                        aria-label="Delete game"
                        title="Delete game"
                      >
                        <TrashBinIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {games.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">No games found. Add your first game!</p>
          </div>
        )}
      </div>

      {/* View Game Modal */}
      <Modal
        isOpen={viewModal.isOpen}
        onClose={viewModal.closeModal}
        className="max-w-4xl p-0 overflow-hidden"
      >
        {viewGame && (
          <div className="bg-white dark:bg-gray-900">
            <div className="relative h-48 sm:h-64 w-full bg-gray-100 dark:bg-gray-800">
              <Image
                src={viewGame.thumb || "/images/placeholder.svg"}
                alt={viewGame.title || "Game"}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
                <div className="p-6 text-white w-full">
                  <h2 className="text-3xl font-bold mb-2">{viewGame.title}</h2>
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    {viewGame.categories?.map((cat, i) => (
                      <span key={i} className="px-2 py-1 bg-white/20 backdrop-blur-md rounded-md">
                        {cat}
                      </span>
                    ))}
                    <span className="px-2 py-1 bg-blue-500/80 backdrop-blur-md rounded-md">
                      {viewGame.orientation}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={viewModal.closeModal}
                className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">Description</h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  {viewGame.description}
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">Embed Code</h3>
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg break-all">
                  <code className="text-sm font-mono text-gray-600 dark:text-gray-300">
                    {viewGame.embedurl}
                  </code>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                <Button variant="outline" onClick={viewModal.closeModal}>
                  Close
                </Button>
                <Button onClick={() => {
                  viewModal.closeModal();
                  handleEditClick({} as any, viewGame);
                }}>
                  Edit Game
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Add/Edit Game Modal */}
      <Modal
        isOpen={addModal.isOpen}
        onClose={addModal.closeModal}
        className="max-w-2xl p-6 lg:p-8"
      >
        <h4 className="mb-6 text-xl font-semibold text-gray-800 dark:text-white/90">
          {isEditMode ? "Edit Game" : "Add New Game"}
        </h4>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }}
          className="space-y-5"
        >
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="title">Game Title *</Label>
              <Input
                type="text"
                value={formData.title || ""}
                onChange={(e) => handleInputChange("title", e.target.value)}
                placeholder="Enter game title"
                className="mt-2"
                required
              />
            </div>

            <div>
              <Label htmlFor="category">Categories</Label>
              <Input
                type="text"
                value={formData.categories?.join(', ') || ""}
                onChange={(e) => handleInputChange("categories", e.target.value.split(',').map(s => s.trim()))}
                placeholder="Comma separated (e.g. Action, Puzzle)"
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="orientation">Orientation</Label>
              <div className="relative mt-2">
                <Select
                  options={[
                    { value: "portrait", label: "Portrait" },
                    { value: "landscape", label: "Landscape" },
                  ]}
                  value={formData.orientation || "portrait"}
                  onChange={(value) => handleInputChange("orientation", value)}
                  placeholder="Select orientation"
                />
                <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2 dark:text-gray-400">
                  <ChevronDownIcon className="w-4 h-4" />
                </span>
              </div>
            </div>

            <div className="sm:col-span-2">
              <Label htmlFor="thumb">Thumbnail URL</Label>
              <Input
                type="url"
                value={formData.thumb || ""}
                onChange={(e) => handleInputChange("thumb", e.target.value)}
                placeholder="https://example.com/game-thumb.jpg"
                className="mt-2"
              />
            </div>

            <div className="sm:col-span-2">
              <Label htmlFor="embedurl">Embed URL</Label>
              <Input
                type="url"
                value={formData.embedurl || ""}
                onChange={(e) => handleInputChange("embedurl", e.target.value)}
                placeholder="https://example.com/game/index.html"
                className="mt-2"
              />
            </div>

            <div className="sm:col-span-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                value={formData.description || ""}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Enter game description..."
                rows={4}
                className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:border-gray-700 dark:placeholder:text-white/30 dark:focus:border-brand-800"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="outline"
              onClick={addModal.closeModal}
            >
              Cancel
            </Button>
            <Button>
              {isEditMode ? "Update Game" : "Add Game"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModal.isOpen}
        onClose={deleteModal.closeModal}
        className="max-w-md p-6"
      >
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-500/15 mb-4">
            <TrashBinIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <h4 className="mb-2 text-lg font-semibold text-gray-800 dark:text-white/90">
            Delete Game
          </h4>
          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
            Are you sure you want to delete <strong>{selectedGame?.title}</strong>? This action cannot be undone.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Button
              variant="outline"
              onClick={deleteModal.closeModal}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

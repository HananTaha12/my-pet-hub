import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, type FormEvent, useMemo } from "react";
import { RequireAuth } from "@/components/RequireAuth";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Heart, MessageSquare, AlertCircle, Share2, Plus, Users, User, Calendar, MapPin, Phone, Mail, Award, Navigation } from "lucide-react";

export const Route = createFileRoute("/community")({
  head: () => ({ meta: [{ title: "Community Board — PetPal" }] }),
  component: () => (<RequireAuth><AppShell><Community /></AppShell></RequireAuth>),
});

interface Post {
  id: string;
  authorName: string;
  authorEmail: string;
  avatar: string;
  content: string;
  likes: number;
  likedByUser: boolean;
  image?: string;
  timestamp: string;
}

interface LostFoundPet {
  id: string;
  type: "Lost" | "Found";
  name: string;
  species: string;
  description: string;
  lastSeenLocation: string;
  date: string;
  contactName: string;
  contactPhone: string;
  status: "Active" | "Reunited";
}

interface AdoptionPet {
  id: string;
  name: string;
  species: string;
  breed: string;
  age: string;
  description: string;
  contactName: string;
  contactEmail: string;
  image?: string;
}

const SEED_POSTS: Post[] = [
  {
    id: "post-1",
    authorName: "Hanan Taha",
    authorEmail: "hanan@pethub.com",
    avatar: "🐈",
    content: "My cat Whiskers absolutely loves the salmon kibble from PetPal! She usually is a very picky eater, but this time she cleared the bowl in two minutes. Highly recommended to cat owners! 🐾🍲",
    likes: 42,
    likedByUser: false,
    image: "/products/cat-food.png",
    timestamp: "2 hours ago"
  },
  {
    id: "post-2",
    authorName: "Dr. Sarah Connor",
    authorEmail: "sarah@clinic.com",
    avatar: "🐕",
    content: "Took Buddy for his annual vaccination checkup at PetPal clinic today. The booking process was super smooth, and our vet was extremely gentle. Buddy even got a treats reward! 💉🐶",
    likes: 18,
    likedByUser: false,
    timestamp: "5 hours ago"
  }
];

const SEED_LOST_FOUND: LostFoundPet[] = [
  {
    id: "lf-1",
    type: "Lost",
    name: "Luna",
    species: "Dog (Maltese)",
    description: "White fluffy Maltese wearing a pink collar. Friendly but very nervous. Missing since June 1st afternoon.",
    lastSeenLocation: "Al-Manara Square near Downtown",
    date: "2026-06-01",
    contactName: "Hanan",
    contactPhone: "+972-599-123456",
    status: "Active"
  },
  {
    id: "lf-2",
    type: "Found",
    name: "Ginger Cat",
    species: "Cat (Tabby)",
    description: "Found an orange tabby cat with a blue bell collar. Very cuddly and healthy. Safe in our backyard.",
    lastSeenLocation: "Nablus Road, East Jerusalem",
    date: "2026-05-30",
    contactName: "Tareq",
    contactPhone: "+972-598-654321",
    status: "Active"
  }
];

const SEED_ADOPTION: AdoptionPet[] = [
  {
    id: "adopt-1",
    name: "Max",
    species: "Dog",
    breed: "Golden Retriever Mix",
    age: "4 months",
    description: "Playful, energetic pup who loves running after tennis balls. Vaccinated and dewormed.",
    contactName: "PetPal Shelter",
    contactEmail: "adopt@petpal.com",
    image: "/products/dog-food.png"
  },
  {
    id: "adopt-2",
    name: "Cleo",
    species: "Cat",
    breed: "Calico Short-hair",
    age: "2 months",
    description: "Affectionate kitten who loves sitting in laps and purring. Microchipped.",
    contactName: "PetPal Shelter",
    contactEmail: "adopt@petpal.com",
    image: "/products/cat-food.png"
  }
];

// Helper to translate address details to coordinates for OpenStreetMap
const getCoordinates = (location: string) => {
  const loc = location.toLowerCase();
  if (loc.includes("manara") || loc.includes("downtown")) {
    return { lat: 31.905, lng: 35.204 }; // Ramallah / Al-Manara
  }
  if (loc.includes("nablus") || loc.includes("east jerusalem")) {
    return { lat: 31.792, lng: 35.231 }; // East Jerusalem
  }
  if (loc.includes("central") || loc.includes("park")) {
    return { lat: 37.783, lng: -122.416 }; // SF Park
  }
  return { lat: 31.903, lng: 35.203 }; // Default
};

function Community() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("feed");
  const [modalOpen, setModalOpen] = useState(false);
  const [postType, setPostType] = useState<"story" | "lost_found" | "adoption">("story");
  
  // Interactive Map Active Pet Selection
  const [selectedLfId, setSelectedLfId] = useState<string | null>("lf-1");

  // State arrays persisted in localStorage
  const [posts, setPosts] = useState<Post[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("petpal_community_posts");
      return saved ? JSON.parse(saved) : SEED_POSTS;
    }
    return SEED_POSTS;
  });

  const [lostFound, setLostFound] = useState<LostFoundPet[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("petpal_community_lf");
      return saved ? JSON.parse(saved) : SEED_LOST_FOUND;
    }
    return SEED_LOST_FOUND;
  });

  const [adoption, setAdoption] = useState<AdoptionPet[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("petpal_community_adoption");
      return saved ? JSON.parse(saved) : SEED_ADOPTION;
    }
    return SEED_ADOPTION;
  });

  useEffect(() => {
    localStorage.setItem("petpal_community_posts", JSON.stringify(posts));
  }, [posts]);

  useEffect(() => {
    localStorage.setItem("petpal_community_lf", JSON.stringify(lostFound));
  }, [lostFound]);

  useEffect(() => {
    localStorage.setItem("petpal_community_adoption", JSON.stringify(adoption));
  }, [adoption]);

  // Form Fields
  const [storyContent, setStoryContent] = useState("");
  const [storyImage, setStoryImage] = useState("");

  const [lfType, setLfType] = useState<"Lost" | "Found">("Lost");
  const [lfName, setLfName] = useState("");
  const [lfSpecies, setLfSpecies] = useState("");
  const [lfLocation, setLfLocation] = useState("");
  const [lfDate, setLfDate] = useState(new Date().toISOString().slice(0, 10));
  const [lfPhone, setLfPhone] = useState("");
  const [lfDesc, setLfDesc] = useState("");

  const [adoptName, setAdoptName] = useState("");
  const [adoptSpecies, setAdoptSpecies] = useState("dog");
  const [adoptBreed, setAdoptBreed] = useState("");
  const [adoptAge, setAdoptAge] = useState("");
  const [adoptEmail, setAdoptEmail] = useState("");
  const [adoptDesc, setAdoptDesc] = useState("");

  const handleLike = (postId: string) => {
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          likes: p.likedByUser ? p.likes - 1 : p.likes + 1,
          likedByUser: !p.likedByUser
        };
      }
      return p;
    }));
  };

  const handleShare = (title: string) => {
    if (navigator.share) {
      navigator.share({ title, text: "Check out this pet update on PetPal!", url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Community link copied to clipboard!");
    }
  };

  const markReunited = (lfId: string) => {
    setLostFound(prev => prev.map(item => {
      if (item.id === lfId) {
        toast.success(`So happy to hear they are safe! 🎉`);
        return { ...item, status: "Reunited" as const };
      }
      return item;
    }));
  };

  const submitPost = (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const email = user.email ?? "owner@petpal.com";
    const authorNameStr = email.split("@")[0];

    if (postType === "story") {
      if (!storyContent.trim()) return toast.error("Write something first");
      const newStory: Post = {
        id: "post-" + Date.now(),
        authorName: authorNameStr,
        authorEmail: email,
        avatar: "🐶",
        content: storyContent,
        likes: 0,
        likedByUser: false,
        image: storyImage || undefined,
        timestamp: "Just now"
      };
      setPosts([newStory, ...posts]);
      setStoryContent("");
      setStoryImage("");
      setActiveTab("feed");
    } else if (postType === "lost_found") {
      if (!lfSpecies || !lfLocation || !lfPhone) return toast.error("Fill in breed, location, and phone details");
      const newLf: LostFoundPet = {
        id: "lf-" + Date.now(),
        type: lfType,
        name: lfName || "Unknown",
        species: lfSpecies,
        description: lfDesc,
        lastSeenLocation: lfLocation,
        date: lfDate,
        contactName: authorNameStr,
        contactPhone: lfPhone,
        status: "Active"
      };
      setLostFound([newLf, ...lostFound]);
      setSelectedLfId(newLf.id);
      setLfName("");
      setLfSpecies("");
      setLfLocation("");
      setLfPhone("");
      setLfDesc("");
      setActiveTab("lostfound");
    } else if (postType === "adoption") {
      if (!adoptName || !adoptBreed || !adoptEmail) return toast.error("Fill in name, breed, and contact email");
      const newAdopt: AdoptionPet = {
        id: "adopt-" + Date.now(),
        name: adoptName,
        species: adoptSpecies,
        breed: adoptBreed,
        age: adoptAge || "Unknown age",
        description: adoptDesc,
        contactName: authorNameStr,
        contactEmail: adoptEmail,
        image: adoptSpecies === "dog" ? "/products/dog-food.png" : "/products/cat-food.png"
      };
      setAdoption([newAdopt, ...adoption]);
      setAdoptName("");
      setAdoptBreed("");
      setAdoptAge("");
      setAdoptEmail("");
      setAdoptDesc("");
      setActiveTab("adoption");
    }

    setModalOpen(false);
    toast.success("Community board updated successfully!");
  };

  // Map settings
  const activeLf = useMemo(() => {
    return lostFound.find(item => item.id === selectedLfId) || lostFound[0];
  }, [lostFound, selectedLfId]);

  const mapSrc = useMemo(() => {
    if (!activeLf) return "";
    const coords = getCoordinates(activeLf.lastSeenLocation);
    const bbox = `${coords.lng - 0.008},${coords.lat - 0.005},${coords.lng + 0.008},${coords.lat + 0.005}`;
    return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${coords.lat},${coords.lng}`;
  }, [activeLf]);

  return (
    <div className="space-y-8 pb-12 transition-all duration-500 animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-semibold tracking-tight">Community Board</h1>
          <p className="text-sm text-muted-foreground mt-1">Connect, share experiences, track missing pets, or browse adoption cards.</p>
        </div>
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-full px-5 shadow-lg shadow-primary/20 hover:scale-105 transition-transform duration-300">
              <Plus className="mr-1.5 h-4.5 w-4.5" /> Create Listing
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-3xl max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-display text-2xl font-bold">New Board Listing</DialogTitle>
            </DialogHeader>
            <form onSubmit={submitPost} className="space-y-4 mt-2">
              <div className="space-y-1">
                <Label>Listing Category</Label>
                <Select value={postType} onValueChange={(v) => setPostType(v as never)}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="story">📸 Pet Story / Post</SelectItem>
                    <SelectItem value="lost_found">🚨 Lost & Found Alert</SelectItem>
                    <SelectItem value="adoption">🏡 Adoption Listing</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Conditional Story Fields */}
              {postType === "story" && (
                <div className="space-y-4 animate-in fade-in duration-300">
                  <div className="space-y-1">
                    <Label>Post Content</Label>
                    <textarea 
                      required
                      value={storyContent}
                      onChange={(e) => setStoryContent(e.target.value)}
                      placeholder="Share a funny story, an milestone, or just update us on your pet's life..."
                      className="flex min-h-[100px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Optional Image Link (e.g. /products/dog-food.png)</Label>
                    <Input value={storyImage} onChange={(e) => setStoryImage(e.target.value)} placeholder="/products/dog-food.png or URL" className="rounded-xl" />
                  </div>
                </div>
              )}

              {/* Conditional Lost/Found Fields */}
              {postType === "lost_found" && (
                <div className="space-y-4 animate-in fade-in duration-300">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>Alert Type</Label>
                      <Select value={lfType} onValueChange={(v) => setLfType(v as never)}>
                        <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="Lost">LOST 🔴</SelectItem>
                          <SelectItem value="Found">FOUND 🟢</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label>Pet Name (If known)</Label>
                      <Input value={lfName} onChange={(e) => setLfName(e.target.value)} placeholder="e.g. Luna" className="rounded-xl" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>Species & Breed</Label>
                      <Input required value={lfSpecies} onChange={(e) => setLfSpecies(e.target.value)} placeholder="e.g. Siamese Cat" className="rounded-xl" />
                    </div>
                    <div className="space-y-1">
                      <Label>Contact Phone</Label>
                      <Input required type="tel" value={lfPhone} onChange={(e) => setLfPhone(e.target.value)} placeholder="+972-599-XXXXXX" className="rounded-xl" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>Last Seen Location</Label>
                      <Input required value={lfLocation} onChange={(e) => setLfLocation(e.target.value)} placeholder="e.g. Al-Manara Square" className="rounded-xl" />
                    </div>
                    <div className="space-y-1">
                      <Label>Date Occurred</Label>
                      <Input type="date" required value={lfDate} onChange={(e) => setLfDate(e.target.value)} className="rounded-xl" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label>Short Description</Label>
                    <textarea 
                      value={lfDesc}
                      onChange={(e) => setLfDesc(e.target.value)}
                      placeholder="Color, marks, collar types, temperament..."
                      className="flex min-h-[80px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    />
                  </div>
                </div>
              )}

              {/* Conditional Adoption Fields */}
              {postType === "adoption" && (
                <div className="space-y-4 animate-in fade-in duration-300">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>Animal Name</Label>
                      <Input required value={adoptName} onChange={(e) => setAdoptName(e.target.value)} placeholder="e.g. Max" className="rounded-xl" />
                    </div>
                    <div className="space-y-1">
                      <Label>Species</Label>
                      <Select value={adoptSpecies} onValueChange={setAdoptSpecies}>
                        <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="dog">Dog 🐕</SelectItem>
                          <SelectItem value="cat">Cat 🐈</SelectItem>
                          <SelectItem value="rabbit">Rabbit 🐇</SelectItem>
                          <SelectItem value="bird">Bird 🦜</SelectItem>
                          <SelectItem value="other">Other 🐾</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>Breed</Label>
                      <Input required value={adoptBreed} onChange={(e) => setAdoptBreed(e.target.value)} placeholder="e.g. Golden Retriever" className="rounded-xl" />
                    </div>
                    <div className="space-y-1">
                      <Label>Age</Label>
                      <Input value={adoptAge} onChange={(e) => setAdoptAge(e.target.value)} placeholder="e.g. 3 months" className="rounded-xl" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label>Contact Email</Label>
                    <Input required type="email" value={adoptEmail} onChange={(e) => setAdoptEmail(e.target.value)} placeholder="shelter@petpal.com" className="rounded-xl" />
                  </div>
                  <div className="space-y-1">
                    <Label>Pet Personality & Health Summary</Label>
                    <textarea 
                      value={adoptDesc}
                      onChange={(e) => setAdoptDesc(e.target.value)}
                      placeholder="Energy level, compatibility with kids, behaviors..."
                      className="flex min-h-[80px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    />
                  </div>
                </div>
              )}

              <Button type="submit" className="w-full rounded-xl py-6 mt-4">Publish Listing</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-3 max-w-md bg-muted/50 p-1.5 rounded-2xl h-auto">
          <TabsTrigger value="feed" className="rounded-xl text-xs font-bold py-2.5 transition-all duration-300">
            <Users className="h-3.5 w-3.5 mr-1.5" /> Stories & Feed
          </TabsTrigger>
          <TabsTrigger value="lostfound" className="rounded-xl text-xs font-bold py-2.5 transition-all duration-300">
            <AlertCircle className="h-3.5 w-3.5 mr-1.5 text-destructive animate-pulse" /> Lost & Found
          </TabsTrigger>
          <TabsTrigger value="adoption" className="rounded-xl text-xs font-bold py-2.5 transition-all duration-300">
            <Award className="h-3.5 w-3.5 mr-1.5" /> Adoption Center
          </TabsTrigger>
        </TabsList>

        {/* Tab Content: Stories Feed */}
        <TabsContent value="feed" className="outline-none space-y-4 animate-in fade-in duration-300">
          {posts.length === 0 ? (
            <p className="rounded-3xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground italic">No stories posted yet. Be the first to share! 📸</p>
          ) : (
            <div className="grid gap-6 max-w-2xl">
              {posts.map((p) => (
                <div key={p.id} className="glass-card rounded-[2rem] p-6 border border-border/50 hover:shadow-xl transition-all duration-500 bg-card/65">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-lg shadow-sm">
                      {p.avatar}
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-sm text-foreground/90">{p.authorName}</h3>
                      <p className="text-[10px] text-muted-foreground font-medium">{p.timestamp}</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground/90 mt-4 leading-relaxed whitespace-pre-line">{p.content}</p>
                  
                  {p.image && (
                    <div className="mt-4 overflow-hidden rounded-2xl max-h-72 border border-border/20 bg-secondary/30">
                      <img src={p.image} alt="Story content" className="w-full object-cover aspect-video" />
                    </div>
                  )}

                  <div className="flex items-center gap-4 mt-6 border-t border-border/20 pt-4 text-xs font-bold">
                    <button 
                      onClick={() => handleLike(p.id)}
                      className={`flex items-center gap-1.5 transition-colors ${
                        p.likedByUser ? "text-primary" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Heart className={`h-4.5 w-4.5 transition-transform ${p.likedByUser ? "fill-current scale-110" : ""}`} />
                      <span>{p.likes} Likes</span>
                    </button>
                    <button 
                      onClick={() => handleShare(p.content)}
                      className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Share2 className="h-4.5 w-4.5" />
                      <span>Share</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tab Content: Lost & Found Board with Map */}
        <TabsContent value="lostfound" className="outline-none space-y-4 animate-in fade-in duration-300">
          <div className="p-4 rounded-2xl bg-destructive/5 border border-destructive/10 text-xs text-destructive max-w-4xl flex items-start gap-2.5">
            <AlertCircle className="h-4.5 w-4.5 flex-shrink-0 animate-pulse mt-0.5" />
            <p className="font-semibold leading-relaxed">
              EMERGENCY BROADCAST BOARD: Click any missing card to verify their coordinates on the OpenStreetMap interactive portal below. Call support immediately for critical updates.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_320px] max-w-5xl items-start">
            {/* Left Column: Missing Card list */}
            <div className="space-y-4">
              {lostFound.length === 0 ? (
                <p className="rounded-3xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground italic">No lost/found alerts at the moment. All pets are home! 🏡</p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {lostFound.map((item) => (
                    <button 
                      key={item.id} 
                      onClick={() => setSelectedLfId(item.id)}
                      className={`relative text-left rounded-3xl p-5 border transition-all duration-300 hover:shadow-md ${
                        selectedLfId === item.id 
                          ? "border-primary bg-primary/5 ring-1 ring-primary/20" 
                          : "border-border bg-card hover:bg-secondary/40"
                      }`}
                    >
                      <div className="absolute top-5 right-5">
                        <Badge variant={item.status === "Reunited" ? "secondary" : item.type === "Lost" ? "destructive" : "default"}>
                          {item.status === "Reunited" ? "REUNITED 🎉" : item.type.toUpperCase()}
                        </Badge>
                      </div>

                      <h3 className="font-display font-bold text-lg text-foreground/95">
                        {item.name} <span className="text-xs font-normal text-muted-foreground/75">· {item.species}</span>
                      </h3>
                      
                      <p className="text-xs text-muted-foreground/95 mt-2 min-h-[40px] italic leading-relaxed line-clamp-2">
                        "{item.description}"
                      </p>

                      <div className="mt-4 space-y-2 border-t border-border/30 pt-3 text-[10px] font-semibold text-muted-foreground/70">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-accent" />
                          <span>Last seen: {item.lastSeenLocation}</span>
                        </div>
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-dashed border-border/10">
                          <span className="text-emerald-500 font-bold flex items-center gap-1">
                            <Phone className="h-3 w-3" /> {item.contactPhone}
                          </span>
                          {item.status === "Active" && (
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={(e) => { e.stopPropagation(); markReunited(item.id); }}
                              className="h-6 text-[9px] font-black text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10 px-2 rounded-xl"
                            >
                              Mark Reunited
                            </Button>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right Column: Interactive Map Widget */}
            {activeLf && (
              <div className="rounded-3xl border border-border bg-card overflow-hidden shadow-md space-y-3 sticky top-24">
                <iframe
                  key={activeLf.id}
                  title="Lost and Found Map"
                  src={mapSrc}
                  className="h-[240px] w-full"
                  loading="lazy"
                />
                <div className="p-4 pt-1 space-y-2 text-xs">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-foreground">{activeLf.name} Spot Info</h4>
                      <p className="text-[10px] text-muted-foreground">{activeLf.lastSeenLocation}</p>
                    </div>
                    <Navigation className="h-4 w-4 text-primary shrink-0" />
                  </div>
                  <p className="text-[10px] text-muted-foreground italic leading-relaxed">
                    Centering coordinates dynamically based on the pet's last seen reporting card.
                  </p>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Tab Content: Adoption Center */}
        <TabsContent value="adoption" className="outline-none space-y-4 animate-in fade-in duration-300">
          {adoption.length === 0 ? (
            <p className="rounded-3xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground/60 italic">No adoption listings at this moment.</p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 max-w-5xl">
              {adoption.map((pet) => (
                <div key={pet.id} className="group overflow-hidden rounded-[2.2rem] glass-card border border-border/40 hover:shadow-xl transition-all duration-500 flex flex-col justify-between bg-card/60">
                  <div className="p-4 space-y-4">
                    {pet.image && (
                      <div className="relative overflow-hidden rounded-[1.6rem] bg-secondary/50">
                        <img src={pet.image} alt={pet.name} className="aspect-square w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                        <div className="absolute top-3 left-3">
                          <Badge className="rounded-xl bg-foreground text-background">{pet.age}</Badge>
                        </div>
                      </div>
                    )}
                    <div className="space-y-1.5 px-1">
                      <h3 className="font-display font-bold text-xl text-foreground/90">{pet.name}</h3>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-accent">{pet.breed}</p>
                      <p className="text-xs text-muted-foreground/90 leading-relaxed italic mt-2">
                        "{pet.description}"
                      </p>
                    </div>
                  </div>

                  <div className="p-4 pt-0 border-t border-border/30 bg-muted/20">
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground py-2 font-medium">
                      <span>Shelter: {pet.contactName}</span>
                    </div>
                    <Button 
                      onClick={() => {
                        toast.success(`Adoption request sent! Shelter will reach out to you at: ${pet.contactEmail} 🏡`);
                      }}
                      className="w-full rounded-xl text-xs font-bold py-5 mt-1 flex items-center gap-1.5 shadow-md shadow-primary/10"
                    >
                      <Mail className="h-4 w-4" /> Request Adoption Info
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

      </Tabs>
    </div>
  );
}

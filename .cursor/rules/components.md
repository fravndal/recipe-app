# Component Reference

## UI Components (`components/ui/`)

### Button
```jsx
import { Button } from "@/components/ui/button";

<Button variant="default|destructive|outline|ghost" size="default|sm|lg|icon">
  Click me
</Button>
```

### Input
```jsx
import { Input } from "@/components/ui/input";

<Input type="text" placeholder="..." className="..." />
```

### Label
```jsx
import { Label } from "@/components/ui/label";

<Label htmlFor="input-id">Label text</Label>
```

### Select
```jsx
import { Select, SelectWrapper } from "@/components/ui/select";

<SelectWrapper>
  <Select value={value} onValueChange={setValue}>
    <option value="">Velg...</option>
    <option value="a">Option A</option>
  </Select>
</SelectWrapper>
```

### Checkbox
```jsx
import { Checkbox } from "@/components/ui/checkbox";

<Checkbox checked={checked} onCheckedChange={setChecked} />
```

### Dialog
```jsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
      <DialogDescription>Description</DialogDescription>
    </DialogHeader>
    {/* Content */}
    <DialogFooter>
      <Button variant="outline" onClick={() => setOpen(false)}>Avbryt</Button>
      <Button onClick={handleSubmit}>Bekreft</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Card
```jsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>Content here</CardContent>
</Card>
```

### Badge
```jsx
import { Badge } from "@/components/ui/badge";

<Badge variant="default|secondary|destructive|outline">Text</Badge>
```

### Spinner
```jsx
import { Spinner } from "@/components/ui/spinner";

<Spinner size="sm|default|lg" />
```

### Textarea
```jsx
import { Textarea } from "@/components/ui/textarea";

<Textarea rows={4} placeholder="..." />
```

### OfflineIndicator
```jsx
import { OfflineIndicator } from "@/components/ui/offline-indicator";

<OfflineIndicator isOnline={true} isSyncing={false} pendingCount={0} />
```

---

## Layout Components (`components/layout/`)

### Shell
Main page wrapper with header and optional bottom navigation.

```jsx
import { Shell } from "@/components/layout/Shell";

<Shell 
  title="Page Title"
  showBack={false}      // Show back button
  showNav={true}        // Show bottom navigation
>
  {children}
</Shell>
```

### Header
Top app bar (usually used via Shell).

```jsx
import { Header } from "@/components/layout/Header";

<Header title="Title" showBack={false} />
```

### BottomNav
Mobile bottom navigation bar.

```jsx
import { BottomNav } from "@/components/layout/BottomNav";

<BottomNav />
```

### EmptyState
Placeholder for empty lists/content.

```jsx
import { EmptyState } from "@/components/layout/EmptyState";

<EmptyState
  icon={IconComponent}
  title="Ingen data"
  description="Beskrivelse av tom tilstand"
  action={<Button>Handling</Button>}
/>
```

---

## Hooks (`hooks/`)

### useAuth
Authentication context hook.

```jsx
import { useAuth } from "@/hooks/useAuth";

const { user, session, loading, signIn, signUp, signOut } = useAuth();

// user.id - Current user's UUID
// session - Full session object
// loading - True while checking auth state
```

### useOfflineSync
Offline data synchronization hook.

```jsx
import { useOfflineSync } from "@/hooks/useOfflineSync";

const { 
  isOnline,      // Network status
  isSyncing,     // Currently syncing
  pendingCount,  // Pending operations count
  cacheList,     // Cache shopping list
  updateItemOffline,
} = useOfflineSync();
```

---

## Utilities (`lib/`)

### supabase.js
Supabase client instance.

```jsx
import { supabase } from "@/lib/supabase";

// Query
const { data, error } = await supabase
  .from("table")
  .select("*")
  .eq("column", value);

// Insert
const { data, error } = await supabase
  .from("table")
  .insert({ column: value })
  .select()
  .single();

// Update
const { error } = await supabase
  .from("table")
  .update({ column: value })
  .eq("id", id);

// Delete
const { error } = await supabase
  .from("table")
  .delete()
  .eq("id", id);
```

### utils.js
Helper functions.

```jsx
import { cn, formatQuantity } from "@/lib/utils";

// cn - Merge Tailwind classes
cn("base-class", conditional && "conditional-class", className)

// formatQuantity - Format numbers nicely
formatQuantity(1.5) // "1.5"
formatQuantity(1.0) // "1"
```

### db.js
IndexedDB operations for offline support.

```jsx
import { db } from "@/lib/db";

// Used internally by useOfflineSync hook
```

---

## Page Structure

Each page follows this pattern:

```jsx
import { useState, useEffect } from "react";
import { Shell } from "@/components/layout/Shell";
import { Spinner } from "@/components/ui/spinner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

export function PageName() {
  const { user } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data, error } = await supabase
      .from("table")
      .select("*");
    if (!error) setData(data);
    setLoading(false);
  };

  if (loading) {
    return (
      <Shell title="Page">
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      </Shell>
    );
  }

  return (
    <Shell title="Page">
      <div className="p-4 max-w-lg mx-auto">
        {/* Content */}
      </div>
    </Shell>
  );
}
```

drop policy if exists "Participants update threads" on public.threads;
create policy "Participants update threads" on public.threads
for update to authenticated
using (auth.uid() = user_a or auth.uid() = user_b)
with check (auth.uid() = user_a or auth.uid() = user_b);

drop policy if exists "Owners can update their posts" on public.posts;
create policy "Owners can update their posts" on public.posts
for update to authenticated
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

drop policy if exists "Users update own profile" on public.profiles;
create policy "Users update own profile" on public.profiles
for update to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "Anyone signed in can view asanti" on public.asanti;
create policy "Participants can view asanti" on public.asanti
for select to authenticated
using (
  auth.uid() = giver_id
  or auth.uid() = receiver_id
  or (thread_id is not null and public.is_thread_participant(thread_id, auth.uid()))
);
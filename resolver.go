//go:generate go run github.com/99designs/gqlgen

package enterprise

import (
	"context"
) // THIS CODE IS A STARTING POINT ONLY. IT WILL NOT BE UPDATED WITH SCHEMA CHANGES.

type Resolver struct{}

func (r *Resolver) Mutation() MutationResolver {
	return &mutationResolver{r}
}
func (r *Resolver) Query() QueryResolver {
	return &queryResolver{r}
}

type mutationResolver struct{ *Resolver }

func (r *mutationResolver) Register(ctx context.Context, name string, email string, password string) (*User, error) {
	panic("not implemented")
}
func (r *mutationResolver) Login(ctx context.Context, name string, password string) (*User, error) {
	panic("not implemented")
}
func (r *mutationResolver) Logout(ctx context.Context) (*bool, error) {
	panic("not implemented")
}

type queryResolver struct{ *Resolver }

func (r *queryResolver) CurrentUser(ctx context.Context) (*User, error) {
	panic("not implemented")
}

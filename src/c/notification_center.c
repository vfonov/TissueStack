/*
 * This file is part of TissueStack.
 *
 * TissueStack is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * TissueStack is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with TissueStack.  If not, see <http://www.gnu.org/licenses/>.
 */
#include "core.h"

void		nc_create_notification(char *name,
				       void (*action)(char *name, t_plugin *plugin, char *command, void *data, t_tissue_stack *t),
				       t_tissue_stack *t)
{
  t_nc_action	*tmp;

  if (t->first_notification == NULL)
    {
      t->first_notification = malloc(sizeof(*t->first_notification));
      tmp = t->first_notification;
    }
  else
    {
      tmp = t->first_notification;
      while (tmp && tmp->next != NULL)
	tmp = tmp->next;
      if (tmp)
	{
	  tmp->next = malloc(sizeof(*tmp->next));
	  tmp = tmp->next;
	}
    }
  tmp->next = NULL;
  tmp->name = strdup(name);
  if (action != NULL)
    {
      tmp->first_func = malloc(sizeof(*tmp->first_func));
      tmp->first_func->action = action;
      tmp->first_func->next = NULL;
  }
  else
    tmp->first_func = NULL;
}

t_nc_action	*nc_get_action_by_name(char *name, t_tissue_stack *t)
{
  t_nc_action	*tmp;

  if ((tmp = t->first_notification) == NULL)
    return (NULL);
  while (tmp != NULL)
    {
      if (strcmp(tmp->name, name) == 0)
	break;
      tmp = tmp->next;
    }
  if (tmp == NULL)
    return (NULL);
  return (tmp);
}

int		nc_raise(int id, char *name, char *command, void *data, t_tissue_stack *t)
{
  t_nc_action	*tmp;
  t_nc_func	*ftmp;
  t_plugin	*p;

  if ((tmp = nc_get_action_by_name(name, t)) == NULL)
    return (-1);
  ftmp = tmp->first_func;
  while (ftmp != NULL)
    {
      p = get_plugin_by_id(id, t);
      if (p == NULL)
	ftmp->action(name, NULL, command, data, t);
      else
	ftmp->action(name, p, command, data, t);
      ftmp = ftmp->next;
    }
  return (1);
}

int		nc_subscribe(char *name, void (*action)(char *name, t_plugin *plugin, char *command, void *data, t_tissue_stack *t),
			     t_tissue_stack *t)
{
  t_nc_action	*tmp;
  t_nc_func	*ftmp;

  if ((tmp = nc_get_action_by_name(name, t)) == NULL)
    return (-1);
  if ((ftmp = tmp->first_func) == NULL)
    {
      tmp->first_func = malloc(sizeof(*tmp->first_func));
      tmp->first_func->action = action;
      tmp->first_func->next = NULL;
    }
  else
    {
      while (ftmp->next != NULL)
	ftmp = ftmp->next;
      ftmp->next = malloc(sizeof(*ftmp->next));
      ftmp = ftmp->next;
      ftmp->next = NULL;
      ftmp->action = action;
    }
  return (1);
}

void		nc_list(t_tissue_stack *t)
{
  t_nc_action	*tmp;
  t_nc_func	*ftmp;

  if ((tmp = t->first_notification) == NULL)
    {
      fprintf(stderr, "\n\nNo notification registered\n\n");
      return;
    }
  while (tmp)
    {
      printf("NOTIFICATION:\n");
      printf("Name = %s\n", tmp->name);
      printf("Actions:\n");
      if ((ftmp = tmp->first_func) == NULL)
	printf("\tNULL\n");
      else
	{
	  while (ftmp)
	    {
	      printf("\t- %p\n", ftmp->action);
	      ftmp = ftmp->next;
	    }
	}
      printf("\n");
      tmp = tmp->next;
    }
}

void		free_all_notifications(t_tissue_stack *t)
{
  t_nc_action	*tmp;
  t_nc_action	*tmp2;
  t_nc_func	*tmp_func;
  t_nc_func	*tmp_func2;

  if (t->first_notification != NULL)
    {
      tmp = t->first_notification;
      while (tmp)
	{
	  tmp_func = tmp->first_func;
	  while (tmp_func)
	    {
	      tmp_func2 = tmp_func;
	      tmp_func = tmp_func->next;
	      free(tmp_func2);
	    }
	  free(tmp->name);
	  tmp2 = tmp;
	  tmp = tmp->next;
	  free(tmp2);
	}
    }
}

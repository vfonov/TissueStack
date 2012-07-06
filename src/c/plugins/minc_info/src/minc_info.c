#include "minc_info.h"

void *init(void *args) {
	// nothing to do
	return NULL;
}

void *start(void *args) {
	if (args == NULL) {
		return NULL;
	}

	t_args_plug	*a = (t_args_plug *)args;
	// check if commands is null, we expect the filename!
	if (a->commands == NULL) {
		return NULL;
	}

	// get volume info
	printf("%s\n", a->commands[0]);
	t_vol *volume = a->general_info->get_volume(a->commands[0], a->general_info);
	if (volume == NULL) printf("Volume is NULL\n");

	// get our unix socket
	int * unix_socket = (int *)a->box;

	// string buffer
	char * buffer = malloc(100 * sizeof(buffer));
	int buffer_capacity = 100;
	int buffer_size = 0;

	// 'amateurish' serialization of data as a CSV string
	appendToBuffer(&buffer, &buffer_size, &buffer_capacity, volume == NULL ? "NULL" : volume->path);
	write(*unix_socket, buffer, buffer_size);
	shutdown(*unix_socket, 2);

	return NULL;
}

void *unload(void *args) {
	// nothing to do
	return NULL;
}

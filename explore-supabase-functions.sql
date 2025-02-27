-- Función para listar todas las tablas del esquema public
CREATE OR REPLACE FUNCTION get_tables()
RETURNS TABLE (
    table_name text,
    owner text,
    tablespace text,
    has_indexes boolean,
    has_rules boolean,
    has_triggers boolean,
    row_security boolean
)
LANGUAGE SQL
SECURITY DEFINER
AS $$
    SELECT 
        tablename::text as table_name,
        tableowner::text as owner,
        tablespace::text,
        hasindexes as has_indexes,
        hasrules as has_rules,
        hastriggers as has_triggers,
        rowsecurity as row_security
    FROM 
        pg_tables
    WHERE 
        schemaname = 'public'
    ORDER BY 
        tablename;
$$;

-- Función para listar todos los triggers
CREATE OR REPLACE FUNCTION get_triggers()
RETURNS TABLE (
    trigger_name text,
    table_name text,
    trigger_schema text,
    event_manipulation text,
    action_statement text,
    action_timing text
)
LANGUAGE SQL
SECURITY DEFINER
AS $$
    SELECT 
        trigger_name::text,
        event_object_table::text as table_name,
        trigger_schema::text,
        event_manipulation::text,
        action_statement::text,
        action_timing::text
    FROM 
        information_schema.triggers
    WHERE 
        trigger_schema = 'public'
    ORDER BY 
        trigger_name;
$$;

-- Función para listar todas las RLS policies
CREATE OR REPLACE FUNCTION get_policies()
RETURNS TABLE (
    policy_name text,
    table_name text,
    roles text[],
    cmd text,
    qual text,
    with_check text
)
LANGUAGE SQL
SECURITY DEFINER
AS $$
    SELECT 
        polname::text as policy_name,
        tablename::text as table_name,
        polroles as roles,
        polcmd::text as cmd,
        polqual::text as qual,
        polwithcheck::text as with_check
    FROM 
        pg_policy
    JOIN 
        pg_class ON pg_policy.polrelid = pg_class.oid
    WHERE 
        relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    ORDER BY 
        tablename, polname;
$$;

-- Función para describir la estructura de una tabla
CREATE OR REPLACE FUNCTION describe_table(table_name text)
RETURNS TABLE (
    column_name text,
    data_type text,
    is_nullable boolean,
    column_default text,
    character_maximum_length integer
)
LANGUAGE SQL
SECURITY DEFINER
AS $$
    SELECT 
        column_name::text,
        data_type::text,
        is_nullable::boolean,
        column_default::text,
        character_maximum_length
    FROM 
        information_schema.columns
    WHERE 
        table_schema = 'public' 
        AND table_name = describe_table.table_name
    ORDER BY 
        ordinal_position;
$$;

-- Función para crear la función get_tables (meta-función)
CREATE OR REPLACE FUNCTION create_get_tables_function()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    EXECUTE '
        CREATE OR REPLACE FUNCTION get_tables()
        RETURNS TABLE (
            table_name text,
            owner text,
            tablespace text,
            has_indexes boolean,
            has_rules boolean,
            has_triggers boolean,
            row_security boolean
        )
        LANGUAGE SQL
        SECURITY DEFINER
        AS $func$
            SELECT 
                tablename::text as table_name,
                tableowner::text as owner,
                tablespace::text,
                hasindexes as has_indexes,
                hasrules as has_rules,
                hastriggers as has_triggers,
                rowsecurity as row_security
            FROM 
                pg_tables
            WHERE 
                schemaname = ''public''
            ORDER BY 
                tablename;
        $func$;
    ';
END;
$$;

-- Función para crear la función get_triggers (meta-función)
CREATE OR REPLACE FUNCTION create_get_triggers_function()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    EXECUTE '
        CREATE OR REPLACE FUNCTION get_triggers()
        RETURNS TABLE (
            trigger_name text,
            table_name text,
            trigger_schema text,
            event_manipulation text,
            action_statement text,
            action_timing text
        )
        LANGUAGE SQL
        SECURITY DEFINER
        AS $func$
            SELECT 
                trigger_name::text,
                event_object_table::text as table_name,
                trigger_schema::text,
                event_manipulation::text,
                action_statement::text,
                action_timing::text
            FROM 
                information_schema.triggers
            WHERE 
                trigger_schema = ''public''
            ORDER BY 
                trigger_name;
        $func$;
    ';
END;
$$;

-- Función para crear la función get_policies (meta-función)
CREATE OR REPLACE FUNCTION create_get_policies_function()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    EXECUTE '
        CREATE OR REPLACE FUNCTION get_policies()
        RETURNS TABLE (
            policy_name text,
            table_name text,
            roles text[],
            cmd text,
            qual text,
            with_check text
        )
        LANGUAGE SQL
        SECURITY DEFINER
        AS $func$
            SELECT 
                polname::text as policy_name,
                tablename::text as table_name,
                polroles as roles,
                polcmd::text as cmd,
                polqual::text as qual,
                polwithcheck::text as with_check
            FROM 
                pg_policy
            JOIN 
                pg_class ON pg_policy.polrelid = pg_class.oid
            WHERE 
                relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = ''public'')
            ORDER BY 
                tablename, polname;
        $func$;
    ';
END;
$$;

-- Función para crear la función describe_table (meta-función)
CREATE OR REPLACE FUNCTION create_describe_table_function()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    EXECUTE '
        CREATE OR REPLACE FUNCTION describe_table(table_name text)
        RETURNS TABLE (
            column_name text,
            data_type text,
            is_nullable boolean,
            column_default text,
            character_maximum_length integer
        )
        LANGUAGE SQL
        SECURITY DEFINER
        AS $func$
            SELECT 
                column_name::text,
                data_type::text,
                is_nullable::boolean,
                column_default::text,
                character_maximum_length
            FROM 
                information_schema.columns
            WHERE 
                table_schema = ''public'' 
                AND table_name = describe_table.table_name
            ORDER BY 
                ordinal_position;
        $func$;
    ';
END;
$$; 